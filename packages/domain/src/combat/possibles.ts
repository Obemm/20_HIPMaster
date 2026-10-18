import { adversaire, carteDe, PLATEAU_MAX, possede, raisonDeNePasAttaquer } from './outils.ts';
import { combinaisonsCibles } from './effets.ts';
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
    if (carte.type !== 'composant') return [];
    return etatJoueur.plateau.length < PLATEAU_MAX ? [{ type: 'poser', carte: instance.id }] : [];
  });
}

/** Sorts et incidents que le joueur peut payer, avec chaque combinaison de cibles légale. */
function jeuxPossibles(etat: EtatPartie, joueur: IdJoueur): Action[] {
  const etatJoueur = etat.joueurs[joueur];
  return etatJoueur.main.flatMap((instance): Action[] => {
    const carte = carteDe(instance.numero);
    if (carte.type !== 'sort' && carte.type !== 'incident') return [];
    if (!estPriseEnCharge(carte) || carte.cout > etatJoueur.debit) return [];
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
    { type: 'finirTour' },
  ];
}
