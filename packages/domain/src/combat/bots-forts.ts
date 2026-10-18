import { appliquer } from './moteur.ts';
import { adversaire, attaqueEffective, possede } from './outils.ts';
import { actionsPossibles } from './possibles.ts';
import { reconstituer } from './reconstitution.ts';
import type { Action, ComposantEnJeu, EtatPartie, IdJoueur } from './types.ts';
import type { VueJoueur } from './vue.ts';

/**
 * Bots « Architecte ESB » et « Agent autonome » (US-021) : ils évaluent leurs actions avec le moteur, sur un état
 * reconstitué depuis leur seule vue (aucune triche).
 */

const VICTOIRE = 10_000;

/** Valeur d'un composant en jeu : sa force, ses PV, et un bonus pour ce qui protège ou dure. */
function valeurComposant(etat: EtatPartie, joueur: IdJoueur, composant: ComposantEnJeu): number {
  let valeur = attaqueEffective(etat, joueur, composant) * 1.5 + composant.pv;
  if (possede(composant, 'garde')) valeur += 2;
  if (possede(composant, 'hub') || possede(composant, 'diffusion')) valeur += 1.5;
  if (composant.immobiliseJusquAuTour !== null || composant.attaqueNulle) valeur -= 1.5;
  return valeur;
}

/** Poids de l'évaluation (réglés par simulation, voir docs/produit/cartes-set-1.md). */
export interface Poids {
  sla: number;
  plateau: number;
  menace: number;
  main: number;
}

export const POIDS_PAR_DEFAUT: Poids = { sla: 2, plateau: 1, menace: 1.5, main: 0.8 };

/** Ce qu'un camp peut infliger au tour suivant : la somme des attaques de ses composants qui pourront attaquer. */
function menace(etat: EtatPartie, joueur: IdJoueur): number {
  return etat.joueurs[joueur].plateau
    .filter((c) => c.immobiliseJusquAuTour === null && !c.attaqueNulle)
    .reduce((total, c) => total + attaqueEffective(etat, joueur, c), 0);
}

/** Évalue une position du point de vue de `joueur` : plus c'est haut, mieux c'est. */
export function evaluer(etat: EtatPartie, joueur: IdJoueur, poids = POIDS_PAR_DEFAUT): number {
  const autre = adversaire(joueur);
  if (etat.issue) {
    if (etat.issue.gagnant === joueur) return VICTOIRE;
    return etat.issue.gagnant === autre ? -VICTOIRE : 0;
  }
  const moi = etat.joueurs[joueur];
  const lui = etat.joueurs[autre];
  const plateau = (j: IdJoueur) =>
    etat.joueurs[j].plateau.reduce((total, c) => total + valeurComposant(etat, j, c), 0);
  // Un SLA bas devient critique : chaque point perdu sous 8 compte double.
  const sla = (valeur: number) => valeur + Math.min(0, valeur - 8);
  // La menace adverse pèse d'autant plus que mon SLA est bas (elle peut me mettre à 0).
  const danger = menace(etat, autre) >= moi.sla ? VICTOIRE / 10 : 0;
  return (
    poids.sla * (sla(moi.sla) - sla(lui.sla)) +
    poids.plateau * (plateau(joueur) - plateau(autre)) -
    poids.menace * menace(etat, autre) -
    danger +
    poids.main * (moi.main.length - lui.main.length / 2)
  );
}

const FIN_DE_TOUR: Action = { type: 'finirTour' };

/** Évalue l'état obtenu après une action ; `finirTour` vaut la position actuelle (le tour adverse n'est pas joué). */
function apres(etat: EtatPartie, action: Action): EtatPartie | null {
  if (action.type === 'finirTour') return etat;
  const resultat = appliquer(etat, action);
  return resultat.ok ? resultat.etat : null;
}

/** Les actions classées de la meilleure à la moins bonne, d'après la position qu'elles laissent juste après. */
function classer(etat: EtatPartie, joueur: IdJoueur, actions: readonly Action[], poids: Poids) {
  return actions
    .map((action) => {
      const suivant = apres(etat, action);
      return { action, suivant, score: suivant ? evaluer(suivant, joueur, poids) : -Infinity };
    })
    .filter((c): c is { action: Action; suivant: EtatPartie; score: number } => c.suivant !== null)
    .sort((a, b) => b.score - a.score);
}

/** Les actions légales du joueur actif (aucune si la partie est finie). */
const actionsDe = (etat: EtatPartie): Action[] => (etat.issue ? [] : actionsPossibles(etat));

/** Réglage d'une recherche : nombre d'actions candidates étudiées, et coups joués ensuite pour chacune. */
export interface Recherche {
  candidats: number;
  profondeur: number;
  poids: Poids;
}

/** Joue le reste du tour (au plus `profondeur` coups) en suivant la meilleure action immédiate. */
function deroulerTour(etat: EtatPartie, joueur: IdJoueur, recherche: Recherche): number {
  let courant = etat;
  for (
    let coup = 0;
    coup < recherche.profondeur && !courant.issue && courant.actif === joueur;
    coup++
  ) {
    const [meilleure] = classer(courant, joueur, actionsDe(courant), recherche.poids);
    if (!meilleure || meilleure.action.type === 'finirTour') break;
    courant = meilleure.suivant;
  }
  return evaluer(courant, joueur, recherche.poids);
}

/** Pour les meilleures actions candidates, joue la suite du tour avant de choisir. */
export function chercher(vue: VueJoueur, recherche: Recherche): Action {
  const etat = reconstituer(vue);
  const candidats = classer(etat, vue.joueur, actionsDe(etat), recherche.poids).slice(
    0,
    recherche.candidats,
  );
  let meilleure: Action = FIN_DE_TOUR;
  let meilleurScore = -Infinity;
  for (const candidat of candidats) {
    const score =
      candidat.action.type === 'finirTour'
        ? candidat.score
        : deroulerTour(candidat.suivant, vue.joueur, recherche);
    if (score > meilleurScore) {
      meilleure = candidat.action;
      meilleurScore = score;
    }
  }
  return meilleure;
}

/**
 * Architecte ESB (moyen) : pour ses 3 meilleures actions immédiates, regarde aussi la meilleure action suivante.
 */
export function choisirActionArchitecteEsb(vue: VueJoueur): Action {
  return chercher(vue, { candidats: 3, profondeur: 1, poids: POIDS_PAR_DEFAUT });
}

/**
 * Agent autonome (difficile) : pour **chacune** de ses actions possibles, regarde la meilleure action suivante ; il
 * voit ainsi qu'un décommissionnement permet de poser une carte, ou qu'un sort affaiblit une cible avant l'attaque.
 * Des recherches plus profondes ou qui simulent la réponse adverse se sont révélées moins fortes en simulation : le
 * hasard et les cartes cachées les trompent (voir docs/produit/cartes-set-1.md).
 */
export function choisirActionAgentAutonome(vue: VueJoueur): Action {
  return chercher(vue, {
    candidats: Number.POSITIVE_INFINITY,
    profondeur: 1,
    poids: POIDS_PAR_DEFAUT,
  });
}
