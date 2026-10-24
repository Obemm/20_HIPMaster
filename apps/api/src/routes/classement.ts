import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Base } from '../db/index.ts';
import { changerClassement, lireClassement, TAILLE_CLASSEMENT } from '../scores/scores.ts';
import { exigerJoueur } from './comptes.ts';

// Contrat : apps/api/openapi/classement.yaml (US-069, ADR 0044).

const schemaScore = z.object({
  pseudo: z.string(),
  points: z.int().min(0),
  cote: z.int().nullable(),
});

export const routesClassement: FastifyPluginAsyncZod<{ base: Base }> = async (app, { base }) => {
  app.get(
    '/classement',
    {
      schema: {
        response: {
          200: z.object({
            moi: schemaScore.extend({ rang: z.int().min(1).nullable(), classe: z.boolean() }),
            joueurs: z
              .array(schemaScore.extend({ rang: z.int().min(1), moi: z.boolean() }))
              .max(TAILLE_CLASSEMENT),
          }),
        },
      },
    },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      const classement = await lireClassement(base, connecte.joueur.id);
      if (!classement) throw new Error('Joueur connecté introuvable.');
      return classement;
    },
  );

  app.put(
    '/moi/classement',
    { schema: { body: z.strictObject({ classe: z.boolean() }) } },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      await changerClassement(base, connecte.joueur.id, requete.body.classe);
      return reponse.status(204).send();
    },
  );
};
