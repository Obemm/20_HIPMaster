import { adversaire, carteDe, PLATEAU_MAX, possede, raisonDeNePasAttaquer } from './outils.ts';
import { estPriseEnCharge } from './prise-en-charge.ts';
import type { Action, Cible, ComposantEnJeu, EtatPartie, IdJoueur } from './types.ts';

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
    return etatJoueur.plateau.length < PLATEAU_MAX ? [{ type: 'poser', carte: instance.id }] : [];
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
    ...decommissions,
    ...attaquesPossibles(etat, joueur),
    { type: 'finirTour' },
  ];
}
