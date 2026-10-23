import { carteDe } from './outils.ts';
import type { Action } from './types.ts';
import type { VueJoueur } from './vue.ts';

type Attaque = Extract<Action, { type: 'attaquer' }>;

const FIN_DE_TOUR: Action = { type: 'finirTour' };

/** Coût d'une carte de la main (les actions ne citent que des cartes de la main du joueur). */
function coutEnMain(vue: VueJoueur, id: string): number {
  const instance = vue.moi.main.find((c) => c.id === id);
  return instance ? carteDe(instance.numero).cout : 0;
}

/** La pose (ou l'évolution) de la carte la plus chère qu'il peut payer ; la première trouvée en cas d'égalité. */
function poserLaPlusChere(vue: VueJoueur): Action | null {
  let pose: Action | null = null;
  let coutMax = -1;
  for (const action of vue.actions) {
    if (action.type !== 'poser' && action.type !== 'evoluer') continue;
    const cout = coutEnMain(vue, action.carte);
    if (cout > coutMax) {
      pose = action;
      coutMax = cout;
    }
  }
  return pose;
}

/** Une attaque sur le SI s'il peut, sinon sur la première cible permise (une Garde, en général). */
function attaquerLeSi(vue: VueJoueur): Action | null {
  const attaques = vue.actions.filter((a): a is Attaque => a.type === 'attaquer');
  return attaques.find((a) => a.cible === 'si') ?? attaques[0] ?? null;
}

/**
 * Profil « débutant » (US-064) : un joueur qui découvre le jeu, modèle des mesures par simulation. Il pose sa carte
 * la plus chère tant qu'il peut, attaque le SI dès qu'il peut (sinon la première cible permise), puis finit son
 * tour ; il ne joue ni sort ni incident, ne décommissionne jamais et ignore Migration, Outillage et Routage.
 */
export function choisirActionDebutant(vue: VueJoueur): Action {
  return poserLaPlusChere(vue) ?? attaquerLeSi(vue) ?? FIN_DE_TOUR;
}

/** A-t-il déjà posé un composant ce tour-ci ? `poseAuTour` compte les tours du joueur. */
const aDejaPose = (vue: VueJoueur) => vue.moi.plateau.some((c) => c.poseAuTour === vue.moi.tours);

/**
 * Bot « Stagiaire » (US-064), le niveau facile : il joue comme le profil débutant, en un peu plus maladroit. Il ne
 * pose qu'une carte par tour, la plus chère qu'il peut payer, puis attaque le SI dès qu'il peut, sinon la première
 * cible permise ; ni sort, ni incident, ni décommissionnement, ni échange réfléchi. Un débutant le bat plus d'une
 * fois sur deux (docs/produit/cartes-set-1.md).
 */
export function choisirActionStagiaire(vue: VueJoueur): Action {
  return (aDejaPose(vue) ? null : poserLaPlusChere(vue)) ?? attaquerLeSi(vue) ?? FIN_DE_TOUR;
}
