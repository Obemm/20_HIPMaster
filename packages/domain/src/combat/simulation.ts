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
): ResultatSimulation {
  const resultat = { parties, victoiresA: 0, victoiresB: 0, nulles: 0, finiesParSla: 0 };
  let tours = 0;
  let slaGagnants = 0;
  for (let i = 0; i < parties; i++) {
    const aEnJ1 = i % 2 === 0;
    const decks = aEnJ1 ? { j1: deckA, j2: deckB } : { j1: deckB, j2: deckA };
    const fin = jouerPartie(decks, graine + i, { j1: strategie, j2: strategie });
    const issue = fin.issue;
    if (!issue) continue;
    tours += fin.tour;
    if (issue.raison === 'sla') resultat.finiesParSla += 1;
    if (issue.gagnant === null) {
      resultat.nulles += 1;
      continue;
    }
    slaGagnants += fin.joueurs[issue.gagnant].sla;
    const gagnantEstA = (issue.gagnant === 'j1') === aEnJ1;
    if (gagnantEstA) resultat.victoiresA += 1;
    else resultat.victoiresB += 1;
  }
  const gagnees = resultat.victoiresA + resultat.victoiresB;
  return {
    ...resultat,
    toursMoyens: parties ? tours / parties : 0,
    slaMoyenGagnant: gagnees ? slaGagnants / gagnees : 0,
  };
}
