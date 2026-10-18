import { carteDe, possede } from './outils.ts';
import type { Action, Cible } from './types.ts';
import type { ComposantVisible, VueJoueur } from './vue.ts';

type Jeu = Extract<Action, { type: 'jouer' }>;

/** Score sous lequel le bot garde sa carte plutôt que de la jouer. */
const SEUIL = 20;

interface Lecture {
  vue: VueJoueur;
  /** Le composant adverse ou allié visé en premier. */
  adverse: ComposantVisible | undefined;
  allie: ComposantVisible | undefined;
}

const cout = (c: ComposantVisible) => carteDe(c.numero).cout;

/** Dégâts infligés à un composant adverse : bien noté s'ils le détruisent. */
function scoreDegats(cible: ComposantVisible | undefined, degats: number): number {
  if (!cible) return 0;
  return cible.pv <= degats ? 70 + cout(cible) * 5 : 15;
}

/** Les adversaires qui menacent : une immobilisation n'a d'intérêt que sur un composant qui frappe fort. */
const menace = (cible: ComposantVisible | undefined) =>
  cible && cible.attaque >= 3 ? 30 + cible.attaque : 0;

const SCORES: Record<number, (l: Lecture, jeu: Jeu) => number> = {
  // Sorts
  21: (l) => menace(l.adverse),
  30: (l) => (l.allie && l.allie.pv <= 2 ? 25 : 10),
  47: (l) => (l.vue.moi.main.length <= 4 ? 45 : 5),
  48: () => 20,
  51: () => 45,
  52: () => 30,
  53: (l, jeu) => {
    const carte = l.vue.moi.defausse.find((c) => c.id === jeu.cibles[0]);
    return carte ? 40 + carteDe(carte.numero).cout * 5 : 0;
  },
  54: (l) => (l.vue.moi.sla <= 8 ? 80 : 0),
  55: (l) => scoreDegats(l.adverse, 2),
  56: (l) => {
    const touches = l.vue.adversaire.plateau;
    const detruits = touches.filter((c) => c.pv <= 1).length;
    return touches.length >= 2 ? detruits * 40 + touches.length * 5 : 0;
  },
  57: (l) => (l.vue.moi.plateau.some((c) => c.doublon) ? 60 : 20),
  58: (l) => (l.allie && l.allie.attaque >= 3 && l.allie.pv > 1 ? 30 + l.allie.attaque : 0),
  // Incidents
  59: (_l, jeu) => (jeu.cibles[1] === 'si' ? 50 : 30),
  60: (l) => (l.adverse?.numero === 1 ? 90 : scoreDegats(l.adverse, 2)),
  61: (l) => {
    if (!l.adverse) return 0;
    return possede(l.adverse, 'garde') ? 55 : 35;
  },
  62: () => 25,
  63: () => 20,
  64: (l) => (l.adverse ? 60 + cout(l.adverse) * 5 + l.adverse.attaque * 3 : 0),
  65: (l) => menace(l.adverse),
  66: () => 15,
  67: (l) => (l.adverse ? 25 + l.adverse.attaque : 0),
  68: (l) => scoreDegats(l.adverse, 2),
  69: (l) => (l.adverse && possede(l.adverse, 'garde') ? 40 : 20),
  70: (_l, jeu) => 15 + jeu.cibles.length * 10,
  71: () => 30,
};

function scoreJeu(vue: VueJoueur, jeu: Jeu): number {
  const instance = vue.moi.main.find((c) => c.id === jeu.carte);
  if (!instance) return 0;
  const premiere: Cible | undefined = jeu.cibles[0];
  const lecture: Lecture = {
    vue,
    adverse: vue.adversaire.plateau.find((c) => c.id === premiere),
    allie: vue.moi.plateau.find((c) => c.id === premiere),
  };
  return SCORES[instance.numero]?.(lecture, jeu) ?? 10;
}

/**
 * Le meilleur sort ou incident à jouer selon des règles simples (détruire, protéger, piocher), sur la seule vue du
 * bot ; `null` si aucun ne vaut la peine.
 */
export function choisirJeu(vue: VueJoueur): Action | null {
  let meilleur: Action | null = null;
  let meilleurScore = SEUIL - 1;
  for (const action of vue.actions) {
    if (action.type !== 'jouer') continue;
    const score = scoreJeu(vue, action);
    if (score > meilleurScore) {
      meilleur = action;
      meilleurScore = score;
    }
  }
  return meilleur;
}
