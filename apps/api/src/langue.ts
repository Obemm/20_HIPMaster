import { type Langue, langueOuReference } from '@hipmaster/domain';
import type { FastifyRequest } from 'fastify';

/**
 * La langue des textes demandée par le client (US-081, ADR 0043) : le paramètre `langue` de l'adresse (`fr`, `en`),
 * le français à défaut ou pour une valeur inconnue. Un paramètre plutôt qu'`Accept-Language` : l'adresse distingue
 * les langues dans tous les caches, celui de Firebase Hosting compris, sans `Vary`.
 */
export function langueDe(requete: FastifyRequest): Langue {
  const { langue } = (requete.query ?? {}) as { langue?: unknown };
  return langueOuReference(langue);
}
