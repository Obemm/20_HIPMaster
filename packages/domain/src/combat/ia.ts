import type { IdCapacite } from '../capacites.ts';
import { tirerIndex } from './alea.ts';
import { attaquer } from './combat.ts';
import { effetsALaPose } from './effets-composants.ts';
import {
  actif,
  adversaire,
  carteDe,
  erreur,
  noter,
  nouveauComposant,
  orchestre,
  possede,
  raisonDeNePasAttaquer,
} from './outils.ts';
import { CAPACITES_PRISES_EN_CHARGE, estPriseEnCharge } from './prise-en-charge.ts';
import type { Action, Cible, ComposantEnJeu, ErreurAction, EtatPartie, IdJoueur } from './types.ts';

/** Capacités IA et Migration (US-020). */

const SOLACE_AGENT_MESH = 39;

const estIa = (numero: number) => carteDe(numero).famille === 'ia';
const estAgent = (composant: ComposantEnJeu) => possede(composant, 'autonome');

// --- Autonome ------------------------------------------------------------------------------------------------

/** Cibles valides d'une attaque contre `defenseur` : ses composants avec Garde s'il y en a, sinon tout et le SI. */
function ciblesValides(etat: EtatPartie, defenseur: IdJoueur): Cible[] {
  const plateau = etat.joueurs[defenseur].plateau.filter(
    (c) => !possede(c, 'quotas') || c.attaquesSubies < 2,
  );
  if (etat.joueurs[defenseur].plateau.some((c) => possede(c, 'garde'))) {
    return plateau.filter((c) => possede(c, 'garde')).map((c) => c.id);
  }
  return [...plateau.map((c) => c.id), 'si'];
}

/**
 * Autonome : au début du tour de leur propriétaire, sans Orchestration, les agents attaquent seuls une cible
 * valide tirée au hasard (deux fois si Délégation le permet).
 */
export function lancerAgentsAutonomes(etat: EtatPartie, joueur: IdJoueur): void {
  if (orchestre(etat, joueur)) return;
  const agents = etat.joueurs[joueur].plateau.filter(estAgent).map((c) => c.id);
  for (const id of agents) {
    for (let attaque = 0; attaque < 2 && !etat.issue; attaque++) {
      const agent = etat.joueurs[joueur].plateau.find((c) => c.id === id);
      if (!agent || raisonDeNePasAttaquer(etat, joueur, agent, { autonome: true })) break;
      const cibles = ciblesValides(etat, adversaire(joueur));
      const cible = cibles[tirerIndex(etat, cibles.length)];
      if (cible === undefined) break;
      attaquer(etat, joueur, id, cible, { autonome: true });
    }
  }
}

// --- Outillage -----------------------------------------------------------------------------------------------

/** Une source d'Outillage est en jeu : un composant avec Outillage, ou Solace Agent Mesh (« vos agents gagnent »). */
const outillageEnJeu = (etat: EtatPartie, joueur: IdJoueur) =>
  etat.joueurs[joueur].plateau.some((c) => possede(c, 'outillage')) ||
  actif(etat, joueur, SOLACE_AGENT_MESH);

export function sourcesOutillage(etat: EtatPartie, joueur: IdJoueur): string[] {
  const etatJoueur = etat.joueurs[joueur];
  if (etatJoueur.outillageUtilise || !outillageEnJeu(etat, joueur)) return [];
  if (!etatJoueur.plateau.some(estAgent)) return [];
  return etatJoueur.plateau.filter((c) => !estIa(c.numero)).map((c) => c.id);
}

/** Outillage : vos agents gagnent, jusqu'à la fin du tour, les capacités d'un de vos composants non IA. */
function outiller(etat: EtatPartie, joueur: IdJoueur, sourceId: string): ErreurAction | null {
  if (!sourcesOutillage(etat, joueur).includes(sourceId)) {
    return erreur('cible-invalide', 'Outillage impossible avec ce composant.');
  }
  const etatJoueur = etat.joueurs[joueur];
  const source = etatJoueur.plateau.find((c) => c.id === sourceId);
  if (!source) return erreur('cible-invalide', 'Outillage impossible avec ce composant.');
  const capacites = carteDe(source.numero)
    .capacites.map((c) => (typeof c === 'string' ? c : c.id))
    .filter((id): id is IdCapacite => CAPACITES_PRISES_EN_CHARGE.has(id));
  for (const agent of etatJoueur.plateau.filter(estAgent)) agent.capacitesEmpruntees = capacites;
  etatJoueur.outillageUtilise = true;
  noter(etat, { type: 'outillage', joueur, source: sourceId });
  return null;
}

// --- Cache sémantique ----------------------------------------------------------------------------------------

/** Coût réel d'une carte : le premier sort IA du tour est gratuit avec Cache sémantique. */
export function coutEffectif(etat: EtatPartie, joueur: IdJoueur, numero: number): number {
  const carte = carteDe(numero);
  const etatJoueur = etat.joueurs[joueur];
  const cache =
    carte.type === 'sort' &&
    carte.famille === 'ia' &&
    !etatJoueur.cacheUtilise &&
    etatJoueur.plateau.some((c) => possede(c, 'cache-semantique'));
  return cache ? 0 : carte.cout;
}

/** À appeler quand un sort est payé : note l'usage du Cache sémantique s'il l'a rendu gratuit. */
export function consommerCache(etat: EtatPartie, joueur: IdJoueur, numero: number): void {
  if (coutEffectif(etat, joueur, numero) === 0 && carteDe(numero).cout > 0) {
    etat.joueurs[joueur].cacheUtilise = true;
  }
}

// --- Routage multi-modèles -----------------------------------------------------------------------------------

/** Les routages possibles : renvoyer un composant IA en main, poser gratuitement un composant IA moins cher. */
export function routagesPossibles(etat: EtatPartie, joueur: IdJoueur): Action[] {
  const etatJoueur = etat.joueurs[joueur];
  if (etatJoueur.routageUtilise) return [];
  if (!etatJoueur.plateau.some((c) => possede(c, 'routage-multi-modeles'))) return [];
  const retours = etatJoueur.plateau.filter(
    (c) => estIa(c.numero) && !possede(c, 'routage-multi-modeles'),
  );
  return retours.flatMap((retour) =>
    etatJoueur.main
      .filter((c) => {
        const carte = carteDe(c.numero);
        return (
          carte.type === 'composant' &&
          carte.famille === 'ia' &&
          estPriseEnCharge(carte) &&
          carte.cout <= carteDe(retour.numero).cout
        );
      })
      .map((c): Action => ({ type: 'router', retour: retour.id, carte: c.id })),
  );
}

function router(
  etat: EtatPartie,
  joueur: IdJoueur,
  retourId: string,
  carteId: string,
): ErreurAction | null {
  const legal = routagesPossibles(etat, joueur).some(
    (a) => a.type === 'router' && a.retour === retourId && a.carte === carteId,
  );
  if (!legal) return erreur('cible-invalide', 'Ce routage n’est pas possible.');
  const etatJoueur = etat.joueurs[joueur];
  const index = etatJoueur.plateau.findIndex((c) => c.id === retourId);
  const retour = etatJoueur.plateau[index];
  const instance = etatJoueur.main.find((c) => c.id === carteId);
  if (!retour || !instance) return erreur('carte-absente', 'Carte introuvable.');
  etatJoueur.main = etatJoueur.main.filter((c) => c.id !== carteId);
  const carteRetour = { id: retour.id, numero: retour.numero };
  etatJoueur.main.push(carteRetour);
  const pose = nouveauComposant(instance, etatJoueur.tours);
  etatJoueur.plateau[index] = pose;
  etatJoueur.routageUtilise = true;
  noter(etat, { type: 'routage', joueur, retour: carteRetour, carte: instance });
  effetsALaPose(etat, joueur, pose, undefined);
  return null;
}

// --- Migration -----------------------------------------------------------------------------------------------

const REDUCTION_MIGRATION = 2;

/** Les migrations possibles : SFTP remplacé par un composant API ou EDA de la main, 2 Débit moins cher. */
export function migrationsPossibles(etat: EtatPartie, joueur: IdJoueur): Action[] {
  const etatJoueur = etat.joueurs[joueur];
  const sources = etatJoueur.plateau.filter((c) => possede(c, 'migration'));
  const cartes = etatJoueur.main.filter((c) => {
    const carte = carteDe(c.numero);
    return (
      carte.type === 'composant' &&
      (carte.famille === 'api' || carte.famille === 'eda') &&
      estPriseEnCharge(carte) &&
      Math.max(0, carte.cout - REDUCTION_MIGRATION) <= etatJoueur.debit
    );
  });
  return sources.flatMap((source) =>
    cartes.map((c): Action => ({ type: 'migrer', source: source.id, carte: c.id })),
  );
}

function migrer(
  etat: EtatPartie,
  joueur: IdJoueur,
  sourceId: string,
  carteId: string,
): ErreurAction | null {
  const legal = migrationsPossibles(etat, joueur).some(
    (a) => a.type === 'migrer' && a.source === sourceId && a.carte === carteId,
  );
  if (!legal) return erreur('cible-invalide', 'Cette migration n’est pas possible.');
  const etatJoueur = etat.joueurs[joueur];
  const index = etatJoueur.plateau.findIndex((c) => c.id === sourceId);
  const source = etatJoueur.plateau[index];
  const instance = etatJoueur.main.find((c) => c.id === carteId);
  if (!source || !instance) return erreur('carte-absente', 'Carte introuvable.');
  etatJoueur.debit -= Math.max(0, carteDe(instance.numero).cout - REDUCTION_MIGRATION);
  etatJoueur.main = etatJoueur.main.filter((c) => c.id !== carteId);
  const origine = { id: source.id, numero: source.numero };
  etatJoueur.defausse.push(origine);
  const pose = nouveauComposant(instance, etatJoueur.tours);
  etatJoueur.plateau[index] = pose;
  noter(etat, { type: 'migration', joueur, origine, carte: instance });
  effetsALaPose(etat, joueur, pose, undefined);
  return null;
}

/** Les actions propres à l'IA et à Migration, pour le moteur. */
export function executerIa(etat: EtatPartie, action: Action): ErreurAction | null | undefined {
  const joueur = etat.actif;
  switch (action.type) {
    case 'outiller':
      return outiller(etat, joueur, action.source);
    case 'router':
      return router(etat, joueur, action.retour, action.carte);
    case 'migrer':
      return migrer(etat, joueur, action.source, action.carte);
    default:
      return undefined;
  }
}

/** Les actions d'IA et de Migration possibles pour le joueur actif. */
export function actionsIaPossibles(etat: EtatPartie, joueur: IdJoueur): Action[] {
  return [
    ...migrationsPossibles(etat, joueur),
    ...routagesPossibles(etat, joueur),
    ...sourcesOutillage(etat, joueur).map((source): Action => ({ type: 'outiller', source })),
  ];
}
