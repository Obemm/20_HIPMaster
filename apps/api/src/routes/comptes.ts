import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  connecterParCode,
  creerJoueur,
  fermerSession,
  joueurDuJeton,
  type Joueur,
  regenererCode,
} from '../comptes/comptes.ts';
import type { Base } from '../db/index.ts';

// Contrat : apps/api/openapi/comptes.yaml (US-022, ADR 0017).

const PROBLEME = 'application/problem+json';
export const refuser = (reponse: FastifyReply, status: number, title: string) =>
  reponse.status(status).type(PROBLEME).send({ type: 'about:blank', title, status });

const schemaJoueur = z.object({ id: z.uuid(), pseudo: z.string() });

const pseudo = z
  .string()
  .trim()
  .min(2)
  .max(24)
  .regex(
    /^[\p{L}\p{N} _.-]+$/u,
    'Lettres, chiffres, espaces, tirets, points et soulignés seulement.',
  );

/** Le jeton de l'en-tête `Authorization: Bearer …`, s'il y en a un. */
export function jetonDe(requete: FastifyRequest): string | null {
  const entete = requete.headers.authorization;
  if (!entete?.startsWith('Bearer ')) return null;
  const jeton = entete.slice('Bearer '.length).trim();
  return jeton.length > 0 && jeton.length <= 128 ? jeton : null;
}

/** Le joueur connecté, ou `null` (et une réponse 401 déjà envoyée). */
export async function exigerJoueur(
  base: Base,
  requete: FastifyRequest,
  reponse: FastifyReply,
): Promise<{ joueur: Joueur; jeton: string } | null> {
  const jeton = jetonDe(requete);
  const joueur = jeton ? await joueurDuJeton(base, jeton) : null;
  if (!jeton || !joueur) {
    await refuser(reponse, 401, 'Compte requis : session absente ou expirée');
    return null;
  }
  return { joueur, jeton };
}

export const routesComptes: FastifyPluginAsyncZod<{ base: Base }> = async (app, { base }) => {
  app.post(
    '/joueurs',
    {
      schema: {
        body: z.object({ pseudo }),
        response: {
          201: z.object({ joueur: schemaJoueur, jeton: z.string(), codeRecuperation: z.string() }),
        },
      },
    },
    async (requete, reponse) =>
      reponse.status(201).send(await creerJoueur(base, requete.body.pseudo)),
  );

  app.post(
    '/sessions',
    {
      schema: {
        body: z.object({ code: z.string().min(1).max(32) }),
        response: { 201: z.object({ joueur: schemaJoueur, jeton: z.string() }) },
      },
    },
    async (requete, reponse) => {
      const session = await connecterParCode(base, requete.body.code);
      if (!session) return refuser(reponse, 401, 'Code de récupération inconnu');
      return reponse.status(201).send(session);
    },
  );

  app.delete('/sessions/courante', async (requete, reponse) => {
    const connecte = await exigerJoueur(base, requete, reponse);
    if (!connecte) return reponse;
    await fermerSession(base, connecte.jeton);
    return reponse.status(204).send();
  });

  app.get('/moi', { schema: { response: { 200: schemaJoueur } } }, async (requete, reponse) => {
    const connecte = await exigerJoueur(base, requete, reponse);
    return connecte ? connecte.joueur : reponse;
  });

  app.post(
    '/moi/code',
    { schema: { response: { 201: z.object({ codeRecuperation: z.string() }) } } },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      const codeRecuperation = await regenererCode(base, connecte.joueur.id);
      return reponse.status(201).send({ codeRecuperation });
    },
  );
};
