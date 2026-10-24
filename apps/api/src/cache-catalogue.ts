import { createHash } from 'node:crypto';
import {
  CHANCES_BOOSTER,
  DECKS_PRETES,
  detaillerCapacites,
  ficheDe,
  NIVEAUX_BOT,
  SET_1,
} from '@hipmaster/domain';
import type { onRequestHookHandler, onSendHookHandler } from 'fastify';

/**
 * Cache HTTP du catalogue (US-057, ADR 0039) : cartes, fiches, decks prêts, niveaux du bot et chances des raretés ne
 * changent qu'avec le code (ADR 0011). Le navigateur et le relais de Firebase Hosting les gardent 5 minutes, puis les
 * revalident par leur `ETag` : 304 sans corps tant que le catalogue n'a pas changé. Les réponses d'un joueur restent en
 * `no-store` (hook global de `app.ts`).
 */
export const CACHE_CATALOGUE = 'public, max-age=300';

/**
 * L'empreinte de tout ce que servent les routes du catalogue, calculée une fois au démarrage : une seule version pour
 * toutes ces routes, qui change dès qu'une carte, une fiche, un deck, un niveau ou une chance change.
 */
export const ETAG_CATALOGUE = `"${createHash('sha256')
  .update(
    JSON.stringify([
      SET_1.map((carte) => ({ ...carte, capacites: detaillerCapacites(carte) })),
      SET_1.map((carte) => ficheDe(carte.numero) ?? null),
      DECKS_PRETES,
      NIVEAUX_BOT.map(({ id, nom, description }) => ({ id, nom, description })),
      CHANCES_BOOSTER,
    ]),
  )
  .digest('base64url')
  .slice(0, 16)}"`;

/** L'en-tête `If-None-Match` désigne-t-il cette étiquette (liste, `W/` ou `*` compris, RFC 9110) ? */
export function etiquetteConnue(entete: string | string[] | undefined, etag: string): boolean {
  const valeur = Array.isArray(entete) ? entete.join(',') : (entete ?? '');
  return valeur
    .split(',')
    .map((etiquette) => etiquette.trim().replace(/^W\//, ''))
    .some((etiquette) => etiquette === '*' || etiquette === etag);
}

/** 304 dès la réception, sans calculer ni sérialiser la réponse, si le client a déjà cette version du catalogue. */
const siDejaConnu: onRequestHookHandler = async (requete, reponse) => {
  if (!etiquetteConnue(requete.headers['if-none-match'], ETAG_CATALOGUE)) return;
  await reponse
    .status(304)
    .header('cache-control', CACHE_CATALOGUE)
    .header('etag', ETAG_CATALOGUE)
    .send();
};

/** Une réponse réussie part avec sa politique de cache ; une erreur (carte inconnue) garde le `no-store` commun. */
const entetesCache: onSendHookHandler = async (_requete, reponse, corps) => {
  if (reponse.statusCode === 200) {
    reponse.header('cache-control', CACHE_CATALOGUE).header('etag', ETAG_CATALOGUE);
  }
  return corps;
};

/** Les options à ajouter à une route du catalogue. */
export const cacheCatalogue = { onRequest: siDejaConnu, onSend: entetesCache };
