import { choisirActionBatchDeNuit } from './bot.ts';
import { appliquer } from './moteur.ts';
import { creerPartie } from './tour.ts';
import type { Action, EtatPartie, IdJoueur } from './types.ts';
import { vueDe, type VueJoueur } from './vue.ts';

export type Strategie = (vue: VueJoueur) => Action;

/** Garde-fou : une partie ne compte jamais autant d'actions (20 tours de quelques actions chacun). */
const ACTIONS_MAX = 2_000;

/** Joue une partie entière entre deux stratégies, chacune ne voyant que sa propre vue. */
export function jouerPartie(
  decks: Record<IdJoueur, readonly number[]>,
  graine: number,
  strategies: Record<IdJoueur, Strategie>,
): EtatPartie {
  let etat = creerPartie(decks, graine);
  let actions = 0;
  while (!etat.issue) {
    actions += 1;
    if (actions > ACTIONS_MAX) throw new Error(`Partie sans fin (graine ${graine}).`);
    const action = strategies[etat.actif](vueDe(etat, etat.actif));
    const resultat = appliquer(etat, action);
    if (!resultat.ok) {
      throw new Error(`Action illégale du bot (graine ${graine}) : ${resultat.erreur.message}`);
    }
    etat = resultat.etat;
  }
  return etat;
}

export interface ResultatSimulation {
  parties: number;
  victoiresA: number;
  victoiresB: number;
  nulles: number;
  /** Parties finies par un SLA à 0 (les autres vont jusqu'au dernier tour). */
  finiesParSla: number;
  toursMoyens: number;
  slaMoyenGagnant: number;
}

/** Compte une partie terminée dans le bilan, du point de vue du deck A. */
function compter(
  bilan: { victoiresA: number; victoiresB: number; nulles: number; finiesParSla: number },
  fin: EtatPartie,
  aEnJ1: boolean,
): { tours: number; slaGagnant: number } {
  const issue = fin.issue;
  if (!issue) return { tours: 0, slaGagnant: 0 };
  if (issue.raison === 'sla') bilan.finiesParSla += 1;
  if (issue.gagnant === null) {
    bilan.nulles += 1;
    return { tours: fin.tour, slaGagnant: 0 };
  }
  if ((issue.gagnant === 'j1') === aEnJ1) bilan.victoiresA += 1;
  else bilan.victoiresB += 1;
  return { tours: fin.tour, slaGagnant: fin.joueurs[issue.gagnant].sla };
}

/**
 * Simulation « bot contre bot » : `parties` parties du deck A contre le deck B, en alternant les places, à partir de
 * graines consécutives. Même graine, même résultat.
 */
export function simuler(
  deckA: readonly number[],
  deckB: readonly number[],
  parties: number,
  graine: number,
  strategie: Strategie = choisirActionBatchDeNuit,
  /** Stratégie du deck B (la même que celle du deck A par défaut) : pour comparer deux niveaux de bot. */
  strategieB: Strategie = strategie,
): ResultatSimulation {
  const bilan = { parties, victoiresA: 0, victoiresB: 0, nulles: 0, finiesParSla: 0 };
  let tours = 0;
  let slaGagnants = 0;
  for (let i = 0; i < parties; i++) {
    const aEnJ1 = i % 2 === 0;
    const decks = aEnJ1 ? { j1: deckA, j2: deckB } : { j1: deckB, j2: deckA };
    const strategies = aEnJ1
      ? { j1: strategie, j2: strategieB }
      : { j1: strategieB, j2: strategie };
    const partie = compter(bilan, jouerPartie(decks, graine + i, strategies), aEnJ1);
    tours += partie.tours;
    slaGagnants += partie.slaGagnant;
  }
  const gagnees = bilan.victoiresA + bilan.victoiresB;
  return {
    ...bilan,
    toursMoyens: parties ? tours / parties : 0,
    slaMoyenGagnant: gagnees ? slaGagnants / gagnees : 0,
  };
}
