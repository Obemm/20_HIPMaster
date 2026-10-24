import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  connecterParCode,
  empreinteJeton,
  fermerAutresSessions,
  fermerSession,
  joueurDuJeton,
  type Joueur,
  regenererCode,
  supprimerCompte,
} from '../comptes/comptes.ts';
import { type Administrateurs, AUCUN, estAdministrateur } from '../comptes/administrateurs.ts';
import { inscrire } from '../comptes/invitations.ts';
import type { Base } from '../db/index.ts';
import { limiter, type LimitesDebit } from '../limites.ts';

// Contrat : apps/api/openapi/comptes.yaml (US-022, ADR 0017 ; protections : US-047, ADR 0025 ; invitations : US-048,
// ADR 0027 ; administrateurs : US-072, ADR 0029).

const PROBLEME = 'application/problem+json';
export const refuser = (reponse: FastifyReply, status: number, title: string) =>
  reponse.status(status).type(PROBLEME).send({ type: 'about:blank', title, status });

/** Le joueur renvoyé ; `administrateur` n'apparaît que pour un administrateur (ADR 0029). */
const schemaJoueur = z.object({
  id: z.uuid(),
  pseudo: z.string(),
  administrateur: z.literal(true).optional(),
});

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

/** L'empreinte du jeton de la requête, qui désigne sa session sans la vérifier en base ; `null` sans jeton. */
export function sessionDe(requete: FastifyRequest): string | null {
  const jeton = jetonDe(requete);
  return jeton ? empreinteJeton(jeton) : null;
}

/** Le joueur connecté, ou `null` (et une réponse 401 déjà envoyée). */
export async function exigerJoueur(
  base: Base,
  requete: FastifyRequest,
  reponse: FastifyReply,
): Promise<{ joueur: Joueur; jeton: string } | null> {
  const jeton = jetonDe(requete);
  const joueur = jeton ? await joueurDuJeton(base, jeton, requete.server.optionsSessions) : null;
  if (!jeton || !joueur) {
    await refuser(reponse, 401, 'Compte requis : session absente ou expirée');
    return null;
  }
  return { joueur, jeton };
}

export const routesComptes: FastifyPluginAsyncZod<{
  base: Base;
  /** Clé secrète des codes de récupération et d'invitation (ADR 0025, 0027). */
  cleCodes: string;
  /** Création de compte réservée aux invités (ADR 0027) ; libre sinon, mais un code fourni est toujours vérifié. */
  inscriptionSurInvitation?: boolean;
  /** Les comptes administrateurs (ADR 0029) : le joueur renvoyé le dit ; personne par défaut. */
  administrateurs?: Administrateurs;
  limites?: LimitesDebit;
}> = async (
  app,
  { base, cleCodes, inscriptionSurInvitation = false, administrateurs = AUCUN, limites },
) => {
  const vu = (joueur: Joueur) =>
    estAdministrateur(administrateurs, joueur.id)
      ? { ...joueur, administrateur: true as const }
      : joueur;

  app.post(
    '/joueurs',
    {
      config: limiter(limites, 'inscription'),
      schema: {
        body: z.object({ pseudo, invitation: z.string().trim().min(1).max(40).optional() }),
        response: {
          201: z.object({ joueur: schemaJoueur, jeton: z.string(), codeRecuperation: z.string() }),
        },
      },
    },
    async (requete, reponse) => {
      const creation = await inscrire(base, requete.body.pseudo, cleCodes, {
        code: requete.body.invitation,
        exigee: inscriptionSurInvitation,
      });
      // Un seul message pour un code absent, inconnu, expiré ou épuisé : il ne dit pas lequel (ADR 0027).
      if (!creation) {
        return refuser(reponse, 403, 'Invitation refusée : code absent, inconnu, expiré ou épuisé');
      }
      return reponse.status(201).send({ ...creation, joueur: vu(creation.joueur) });
    },
  );

  app.post(
    '/sessions',
    {
      config: limiter(limites, 'connexion'),
      schema: {
        body: z.object({ code: z.string().min(1).max(32) }),
        response: { 201: z.object({ joueur: schemaJoueur, jeton: z.string() }) },
      },
    },
    async (requete, reponse) => {
      const session = await connecterParCode(base, requete.body.code, cleCodes);
      if (!session) return refuser(reponse, 401, 'Code de récupération inconnu');
      return reponse.status(201).send({ ...session, joueur: vu(session.joueur) });
    },
  );

  app.delete('/sessions/courante', async (requete, reponse) => {
    const connecte = await exigerJoueur(base, requete, reponse);
    if (!connecte) return reponse;
    await fermerSession(base, connecte.jeton);
    return reponse.status(204).send();
  });

  app.delete(
    '/sessions/autres',
    { schema: { response: { 200: z.object({ sessionsFermees: z.int().min(0) }) } } },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      return {
        sessionsFermees: await fermerAutresSessions(base, connecte.joueur.id, connecte.jeton),
      };
    },
  );

  app.get('/moi', { schema: { response: { 200: schemaJoueur } } }, async (requete, reponse) => {
    const connecte = await exigerJoueur(base, requete, reponse);
    return connecte ? vu(connecte.joueur) : reponse;
  });

  // Suppression définitive du compte (US-053, ADR 0031).
  app.delete('/moi', async (requete, reponse) => {
    const connecte = await exigerJoueur(base, requete, reponse);
    if (!connecte) return reponse;
    await supprimerCompte(base, connecte.joueur.id);
    return reponse.status(204).send();
  });

  app.post(
    '/moi/code',
    {
      schema: {
        response: {
          201: z.object({ codeRecuperation: z.string(), sessionsFermees: z.int().min(0) }),
        },
      },
    },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      return reponse
        .status(201)
        .send(await regenererCode(base, connecte.joueur.id, connecte.jeton, cleCodes));
    },
  );
};
