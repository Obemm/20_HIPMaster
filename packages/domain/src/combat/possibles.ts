import { adversaire, carteDe, PLATEAU_MAX, possede, raisonDeNePasAttaquer } from './outils.ts';
import { ciblesDeRenfort } from './effets-composants.ts';
import { combinaisonsCibles } from './effets.ts';
import { actionsIaPossibles, coutEffectif } from './ia.ts';
import { estPriseEnCharge } from './prise-en-charge.ts';
import type {
  Action,
  Cible,
  ComposantEnJeu,
  EtatPartie,
  IdJoueur,
  InstanceCarte,
} from './types.ts';

/** Poses de composants et d'évolutions que le joueur peut payer. */
function posesPossibles(etat: EtatPartie, joueur: IdJoueur): Action[] {
  const etatJoueur = etat.joueurs[joueur];
  return etatJoueur.main.flatMap((instance): Action[] => {
    const carte = carteDe(instance.numero);
    if (!estPriseEnCharge(carte) || carte.cout > etatJoueur.debit) return [];
    if (carte.type === 'evolution') {
      return etatJoueur.plateau
        .filter((c) => c.numero === carte.origine)
        .map((origine) => ({ type: 'evoluer', carte: instance.id, origine: origine.id }));
    }
    if (carte.type !== 'composant' || etatJoueur.plateau.length >= PLATEAU_MAX) return [];
    // OpenAPI, AsyncAPI : une pose par composant à renforcer, s'il y en a.
    const renforts = ciblesDeRenfort(etat, joueur, carte.numero);
    if (renforts.length === 0) return [{ type: 'poser', carte: instance.id }];
    return renforts.map((cible) => ({ type: 'poser', carte: instance.id, cible }));
  });
}

/** Sorts et incidents que le joueur peut payer, avec chaque combinaison de cibles légale. */
function jeuxPossibles(etat: EtatPartie, joueur: IdJoueur): Action[] {
  const etatJoueur = etat.joueurs[joueur];
  return etatJoueur.main.flatMap((instance): Action[] => {
    const carte = carteDe(instance.numero);
    if (carte.type !== 'sort' && carte.type !== 'incident') return [];
    const cout = coutEffectif(etat, joueur, carte.numero);
    if (!estPriseEnCharge(carte) || cout > etatJoueur.debit) return [];
    return combinaisonsCibles(etat, joueur, carte.numero).map((cibles) => ({
      type: 'jouer',
      carte: instance.id,
      cibles,
    }));
  });
}

/** Cibles légales d'une attaque : les composants avec Garde s'il y en a, sinon tous les composants et le SI. */
function ciblesPossibles(defenseurs: readonly ComposantEnJeu[]): Cible[] {
  const attaquables = defenseurs.filter((c) => !possede(c, 'quotas') || c.attaquesSubies < 2);
  if (defenseurs.some((c) => possede(c, 'garde'))) {
    return attaquables.filter((c) => possede(c, 'garde')).map((c) => c.id);
  }
  return [...attaquables.map((c) => c.id), 'si'];
}

function attaquesPossibles(etat: EtatPartie, joueur: IdJoueur): Action[] {
  const cibles = ciblesPossibles(etat.joueurs[adversaire(joueur)].plateau);
  return etat.joueurs[joueur].plateau
    .filter((attaquant) => !raisonDeNePasAttaquer(etat, joueur, attaquant))
    .flatMap((attaquant) =>
      cibles.map((cible): Action => ({ type: 'attaquer', attaquant: attaquant.id, cible })),
    );
}

/** Toutes les actions légales du joueur actif (aucune si la partie est terminée). */
export function actionsPossibles(etat: EtatPartie): Action[] {
  if (etat.issue) return [];
  const joueur = etat.actif;
  const etatJoueur = etat.joueurs[joueur];
  const decommissions: Action[] = etatJoueur.aDecommissionne
    ? []
    : etatJoueur.main.map((instance) => ({ type: 'decommissionner', carte: instance.id }));
  return [
    ...posesPossibles(etat, joueur),
    ...jeuxPossibles(etat, joueur),
    ...decommissions,
    ...attaquesPossibles(etat, joueur),
    ...actionsIaPossibles(etat, joueur),
    { type: 'finirTour' },
  ];
}

/** Les actions qui jouent une carte de la main (Décommissionner n'en est pas une : la carte n'entre pas en jeu). */
const JOUE_LA_CARTE: ReadonlySet<Action['type']> = new Set([
  'poser',
  'evoluer',
  'jouer',
  'migrer',
  'router',
]);

/** « de Solace Event Mesh », « d’Apigee API Gateway ». */
const de = (nom: string): string => (/^[aeiouyàâéèêîôû]/i.test(nom) ? `d’${nom}` : `de ${nom}`);

/**
 * Pourquoi cette carte de la main ne se joue pas maintenant (US-071) ; `null` si une action légale la joue. Se
 * déduit des actions légales déjà calculées (`actions`, celles de `actionsPossibles`), puis nomme l'obstacle : c'est
 * le serveur qui explique, l'écran ne fait qu'afficher (ADR 0004).
 */
export function raisonDeNePasJouer(
  etat: EtatPartie,
  joueur: IdJoueur,
  instance: InstanceCarte,
  actions: readonly Action[],
): string | null {
  if (etat.actif !== joueur)
    return 'Ce n’est pas votre tour : attendez le vôtre pour jouer cette carte.';
  if (actions.some((a) => JOUE_LA_CARTE.has(a.type) && 'carte' in a && a.carte === instance.id)) {
    return null;
  }
  const carte = carteDe(instance.numero);
  if (!estPriseEnCharge(carte)) return 'Cette carte n’est pas encore prise en charge par le jeu.';
  const etatJoueur = etat.joueurs[joueur];
  if (carte.type === 'evolution' && !etatJoueur.plateau.some((c) => c.numero === carte.origine)) {
    const origine = carteDe(carte.origine).nom;
    return `Évolution ${de(origine)} : posez d’abord ${origine}, puis faites-la évoluer.`;
  }
  if (carte.type === 'composant' && etatJoueur.plateau.length >= PLATEAU_MAX) {
    return `Plateau plein : ${PLATEAU_MAX} composants au plus.`;
  }
  const cout = coutEffectif(etat, joueur, carte.numero);
  if (cout > etatJoueur.debit)
    return `Il vous faut ${cout} Débit, vous en avez ${etatJoueur.debit}.`;
  return 'Aucune cible possible pour cette carte maintenant.';
}
