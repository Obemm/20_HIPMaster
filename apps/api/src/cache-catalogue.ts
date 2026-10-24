import { createHash } from 'node:crypto';
import {
  CHANCES_BOOSTER,
  DECKS_PRETES,
  detaillerCapacites,
  ficheDe,
  type Langue,
  LANGUES,
  NIVEAUX_BOT,
  SET_1,
  traduireCarte,
  traduireNomme,
} from '@hipmaster/domain';
import type { onRequestHookHandler, onSendHookHandler } from 'fastify';
import { langueDe } from './langue.ts';

/**
 * Cache HTTP du catalogue (US-057, ADR 0039) : cartes, fiches, decks prêts, niveaux du bot et chances des raretés ne
 * changent qu'avec le code (ADR 0011). Le navigateur et le relais de Firebase Hosting les gardent 5 minutes, puis les
 * revalident par leur `ETag` : 304 sans corps tant que le catalogue n'a pas changé. Les réponses d'un joueur restent en
 * `no-store` (hook global de `app.ts`).
 */
export const CACHE_CATALOGUE = 'public, max-age=300';

/**
 * L'empreinte de tout ce que servent les routes du catalogue dans une langue (US-081), calculée une fois au démarrage :
 * une seule version pour toutes ces routes, qui change dès qu'une carte, une fiche, un deck, un niveau, une chance ou
 * une traduction change. Chaque langue a la sienne : ses réponses sont d'autres représentations.
 */
function empreinteCatalogue(langue: Langue): string {
  const empreinte = createHash('sha256')
    .update(
      JSON.stringify([
        langue,
        SET_1.map((carte) => ({
          ...traduireCarte(carte, langue),
          capacites: detaillerCapacites(carte, langue),
        })),
        SET_1.map((carte) => ficheDe(carte.numero, langue) ?? null),
        DECKS_PRETES.map((deck) => traduireNomme(deck, langue, 'decks')),
        NIVEAUX_BOT.map(({ id, nom, description }) =>
          traduireNomme({ id, nom, description }, langue, 'niveaux'),
        ),
        CHANCES_BOOSTER,
      ]),
    )
    .digest('base64url')
    .slice(0, 16);
  return `"${empreinte}"`;
}

export const ETAGS_CATALOGUE: Readonly<Record<Langue, string>> = Object.fromEntries(
  LANGUES.map((langue) => [langue, empreinteCatalogue(langue)]),
) as Record<Langue, string>;

/** L'empreinte du catalogue en français, la langue de référence. */
export const ETAG_CATALOGUE = ETAGS_CATALOGUE.fr;

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
  const etag = ETAGS_CATALOGUE[langueDe(requete)];
  if (!etiquetteConnue(requete.headers['if-none-match'], etag)) return;
  await reponse.status(304).header('cache-control', CACHE_CATALOGUE).header('etag', etag).send();
};

/** Une réponse réussie part avec sa politique de cache ; une erreur (carte inconnue) garde le `no-store` commun. */
const entetesCache: onSendHookHandler = async (requete, reponse, corps) => {
  if (reponse.statusCode === 200) {
    reponse
      .header('cache-control', CACHE_CATALOGUE)
      .header('etag', ETAGS_CATALOGUE[langueDe(requete)]);
  }
  return corps;
};

/** Les options à ajouter à une route du catalogue. */
export const cacheCatalogue = { onRequest: siDejaConnu, onSend: entetesCache };
