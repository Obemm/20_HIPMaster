import { randomBytes } from 'node:crypto';
import type { Graine } from '@hipmaster/domain';

/**
 * La graine d'une partie ou d'un duel (ADR 0034) : une clé ChaCha20 de 256 bits tirée par `node:crypto`. Elle reste en
 * base, dans l'état de la partie, et n'est jamais envoyée à un joueur.
 */
export function tirerGraine(): Graine {
  const octets = randomBytes(32);
  return Array.from({ length: 8 }, (_, i) => octets.readUInt32LE(i * 4));
}

/** Un entier tiré de la graine, pour choisir dans une petite liste (le deck du bot). */
export function premierMot(graine: Graine): number {
  return typeof graine === 'number' ? graine : (graine[0] ?? 0);
}
