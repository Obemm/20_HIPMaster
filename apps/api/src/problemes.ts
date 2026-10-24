import type { FastifyReply } from 'fastify';

/** Type de contenu des erreurs (RFC 9457). */
export const PROBLEME = 'application/problem+json';

/**
 * Une erreur de l'API (Problem Details, RFC 9457) : `title` en français, pour qui lit la réponse, et `code`, stable,
 * que le front traduit dans la langue du joueur (US-082, ADR 0042) ; le titre français reste son repli. Un code ne
 * change jamais de sens : on en ajoute, on n'en renomme pas.
 */
export interface Probleme {
  type: 'about:blank';
  title: string;
  status: number;
  code: string;
  detail?: string;
}

export function probleme(status: number, code: string, title: string, detail?: string): Probleme {
  return { type: 'about:blank', title, status, code, ...(detail !== undefined && { detail }) };
}

/** Répond par une erreur au format Problem Details. */
export function envoyerProbleme(
  reponse: FastifyReply,
  status: number,
  code: string,
  title: string,
  detail?: string,
) {
  return reponse
    .status(status)
    .type(PROBLEME)
    .send(probleme(status, code, title, detail));
}

/** Une erreur levée dans une route, que le gestionnaire commun traduit en Problem Details avec son code. */
export function erreurProbleme(status: number, code: string, title: string): Error {
  return Object.assign(new Error(title), { statusCode: status, codeProbleme: code });
}

/** Le code stable d'une erreur que Fastify ou une route a levée, d'après son statut à défaut de mieux. */
export function codeErreur(erreur: { statusCode?: number; code?: string; codeProbleme?: string }) {
  if (erreur.codeProbleme) return erreur.codeProbleme;
  const statut = erreur.statusCode ?? 500;
  if (statut >= 500) return 'erreur-interne';
  if (statut === 429) return 'trop-de-requetes';
  if (erreur.code === 'FST_ERR_CTP_BODY_TOO_LARGE') return 'corps-trop-volumineux';
  if (statut === 404) return 'ressource-introuvable';
  return 'requete-invalide';
}
