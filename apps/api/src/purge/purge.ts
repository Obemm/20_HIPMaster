import { DUREE_SESSION_MS, purgerSessionsExpirees } from '../comptes/comptes.ts';
import type { Base } from '../db/index.ts';
import { purgerDefisExpires } from '../duels/duels.ts';
import { purgerPartiesExpirees } from '../parties/parties.ts';

/**
 * La purge de chaque nuit (US-054, ADR 0035). Elle ne supprime que des données techniques, selon les durées annoncées
 * par la page de confidentialité (ADR 0031) : sessions inutilisées, défis jamais acceptés, parties contre le bot
 * abandonnées. Elle ne touche **jamais** un compte, une collection, une récompense ni un duel commencé : seul le
 * joueur supprime son compte (US-053).
 */

export interface OptionsPurge {
  /** Horloge, injectable pour les tests. */
  maintenant?: () => number;
  /** Durée sans usage au-delà de laquelle une session expire : 90 jours par défaut. */
  dureeSessionMs?: number;
}

/** Ce que la purge a supprimé, journalisé par la commande. */
export interface BilanPurge {
  sessions: number;
  defis: number;
  parties: number;
}

export async function purger(base: Base, options: OptionsPurge = {}): Promise<BilanPurge> {
  const maintenant = options.maintenant ?? Date.now;
  // Les parties d'abord : celles d'une session expirée partiraient avec elle sans être comptées.
  const parties = await purgerPartiesExpirees(base, { maintenant });
  const defis = await purgerDefisExpires(base, { maintenant });
  const sessions = await purgerSessionsExpirees(base, {
    maintenant,
    dureeMs: options.dureeSessionMs ?? DUREE_SESSION_MS,
  });
  return { sessions, defis, parties };
}
