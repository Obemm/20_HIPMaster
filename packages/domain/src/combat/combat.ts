import { melanger } from './alea.ts';
import {
  adversaire,
  attaqueEffective,
  blesserSi,
  consommerCron,
  erreur,
  MAIN_MAX,
  noter,
  possede,
  raisonDeNePasAttaquer,
} from './outils.ts';
import type {
  CauseDegats,
  Cible,
  ComposantEnJeu,
  ErreurAction,
  EtatPartie,
  IdJoueur,
} from './types.ts';

/**
 * Inflige des dégâts à un composant : Doublon les double une fois, Couplage fort les inflige aussi au composant lié.
 * Les destructions sont résolues plus tard (`resoudreDestructions`).
 */
export function blesser(
  etat: EtatPartie,
  joueur: IdJoueur,
  composant: ComposantEnJeu,
  montantBrut: number,
  cause: CauseDegats,
): void {
  if (montantBrut <= 0) return;
  const montant = composant.doublon ? montantBrut * 2 : montantBrut;
  composant.doublon = false;
  composant.pv -= montant;
  noter(etat, { type: 'degats', cible: composant.id, joueur, montant, cause });
  if (cause === 'couplage' || composant.coupleA === null) return;
  const lie = etat.joueurs[joueur].plateau.find((c) => c.id === composant.coupleA && c.pv > 0);
  if (lie) blesser(etat, joueur, lie, montant, 'couplage');
}

/** File durable : une fois par partie, un composant détruit revient en main (si une carte File durable est là). */
function recupererParFileDurable(
  etat: EtatPartie,
  joueur: IdJoueur,
  detruit: ComposantEnJeu,
): boolean {
  const proprietaire = etat.joueurs[joueur];
  const fileEnJeu =
    possede(detruit, 'file-durable') ||
    proprietaire.plateau.some((allie) => possede(allie, 'file-durable'));
  if (proprietaire.fileDurableUtilisee || !fileEnJeu || proprietaire.main.length >= MAIN_MAX) {
    return false;
  }
  proprietaire.fileDurableUtilisee = true;
  const carte = { id: detruit.id, numero: detruit.numero };
  proprietaire.main.push(carte);
  noter(etat, { type: 'retour-main', joueur, carte });
  return true;
}

/** Retire les composants à 0 PV, en cascade (Point unique peut en détruire d'autres). */
export function resoudreDestructions(etat: EtatPartie): void {
  for (;;) {
    const detruits = (['j1', 'j2'] as const).flatMap((joueur) =>
      etat.joueurs[joueur].plateau
        .filter((composant) => composant.pv <= 0)
        .map((composant) => ({ joueur, composant })),
    );
    if (detruits.length === 0) return;
    for (const { joueur, composant } of detruits) {
      const proprietaire = etat.joueurs[joueur];
      proprietaire.plateau = proprietaire.plateau.filter((c) => c.id !== composant.id);
      const carte = { id: composant.id, numero: composant.numero };
      noter(etat, { type: 'destruction', joueur, carte });
      if (!recupererParFileDurable(etat, joueur, composant)) proprietaire.defausse.push(carte);
      if (possede(composant, 'point-unique')) {
        for (const allie of proprietaire.plateau) blesser(etat, joueur, allie, 1, 'point-unique');
      }
    }
  }
}

/** Diffusion : 1 dégât à 2 autres composants adverses au plus, tirés au hasard. */
function diffuser(etat: EtatPartie, cibleJoueur: IdJoueur, cibleId: string): void {
  const autres = etat.joueurs[cibleJoueur].plateau.filter((c) => c.id !== cibleId && c.pv > 0);
  melanger(etat, autres);
  for (const autre of autres.slice(0, 2)) blesser(etat, cibleJoueur, autre, 1, 'diffusion');
}

/** Réactif : une fois par tour et par carte, un composant attaqué fait subir 1 dégât à l'attaquant. */
function reagir(
  etat: EtatPartie,
  defenseur: IdJoueur,
  attaquant: ComposantEnJeu,
  attaquantDe: IdJoueur,
) {
  const reactif = etat.joueurs[defenseur].plateau.find(
    (c) => c.pv > 0 && !c.reactifUtilise && possede(c, 'reactif'),
  );
  if (!reactif || attaquant.pv <= 0) return;
  reactif.reactifUtilise = true;
  blesser(etat, attaquantDe, attaquant, 1, 'reactif');
}

function verifierCible(
  defenseurs: readonly ComposantEnJeu[],
  cible: Cible,
): ErreurAction | ComposantEnJeu | null {
  const gardes = defenseurs.filter((c) => possede(c, 'garde'));
  if (cible === 'si') {
    return gardes.length > 0 ? erreur('garde', 'Un composant avec Garde protège le SI.') : null;
  }
  const defenseur = defenseurs.find((c) => c.id === cible);
  if (!defenseur) return erreur('cible-invalide', 'Cette cible n’est pas sur le plateau adverse.');
  if (gardes.length > 0 && !possede(defenseur, 'garde')) {
    return erreur('garde', 'Il faut d’abord attaquer un composant avec Garde.');
  }
  if (possede(defenseur, 'quotas') && defenseur.attaquesSubies >= 2) {
    return erreur('quotas', 'Quotas : ce composant a déjà subi 2 attaques ce tour.');
  }
  return defenseur;
}

/** Résout une attaque du joueur actif ; renvoie une erreur si elle est illégale. */
export function attaquer(
  etat: EtatPartie,
  joueur: IdJoueur,
  attaquantId: string,
  cible: Cible,
  options: { autonome?: boolean } = {},
): ErreurAction | null {
  const attaquant = etat.joueurs[joueur].plateau.find((c) => c.id === attaquantId);
  if (!attaquant) return erreur('carte-absente', 'Ce composant n’est pas sur votre plateau.');
  const raison = raisonDeNePasAttaquer(etat, joueur, attaquant, options);
  if (raison) return erreur('ne-peut-pas-attaquer', raison);

  const defenseurDe = adversaire(joueur);
  const verification = verifierCible(etat.joueurs[defenseurDe].plateau, cible);
  if (verification && 'code' in verification) return verification;

  const force = attaquant.attaqueNulle ? 0 : attaqueEffective(etat, joueur, attaquant);
  attaquant.attaqueNulle = false;
  consommerCron(etat, joueur, attaquant);
  if (attaquant.aAttaqueCeTour) {
    // Seconde attaque du tour : c'est la Délégation qui la permet.
    attaquant.delegue = true;
    etat.joueurs[joueur].delegationUtilisee = true;
  }
  attaquant.aAttaqueCeTour = true;
  attaquant.dernierTourAttaque = etat.joueurs[joueur].tours;
  noter(etat, { type: 'attaque', joueur, attaquant: attaquant.id, cible });

  if (!verification) {
    blesserSi(etat, defenseurDe, force, 'combat');
    return null;
  }
  const defenseur = verification;
  defenseur.attaquesSubies += 1;
  echanger(
    etat,
    { joueur, composant: attaquant, force },
    { joueur: defenseurDe, composant: defenseur },
  );
  if (possede(attaquant, 'diffusion')) diffuser(etat, defenseurDe, defenseur.id);
  reagir(etat, defenseurDe, attaquant, joueur);
  resoudreDestructions(etat);
  return null;
}

/** Échange de coups entre deux composants : l'attaquant inflige `force`, le défenseur riposte. */
export function echanger(
  etat: EtatPartie,
  attaquant: { joueur: IdJoueur; composant: ComposantEnJeu; force: number },
  defenseur: { joueur: IdJoueur; composant: ComposantEnJeu },
): void {
  const riposte = attaqueEffective(etat, defenseur.joueur, defenseur.composant);
  blesser(etat, defenseur.joueur, defenseur.composant, attaquant.force, 'combat');
  blesser(etat, attaquant.joueur, attaquant.composant, riposte, 'riposte');
}

/**
 * Attaque forcée par un effet (Hallucination, Prompt injection) : sans les règles de cible (Garde, Quotas), sans
 * Diffusion ni Réactif, et sans consommer l'attaque du tour.
 */
export function attaqueForcee(
  etat: EtatPartie,
  attaquant: { joueur: IdJoueur; composant: ComposantEnJeu },
  cible: { joueur: IdJoueur; id: Cible },
): void {
  const force = attaqueEffective(etat, attaquant.joueur, attaquant.composant);
  noter(etat, {
    type: 'attaque',
    joueur: attaquant.joueur,
    attaquant: attaquant.composant.id,
    cible: cible.id,
  });
  if (cible.id === 'si') {
    blesserSi(etat, cible.joueur, force, 'combat');
    return;
  }
  const defenseur = etat.joueurs[cible.joueur].plateau.find((c) => c.id === cible.id);
  if (defenseur) {
    echanger(etat, { ...attaquant, force }, { joueur: cible.joueur, composant: defenseur });
  }
  resoudreDestructions(etat);
}
