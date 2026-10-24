import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { lireBoosters, type OptionsBoosters, ouvrirUnBooster } from '../comptes/boosters.ts';
import { utiliserCodeBoosters } from '../comptes/codes-boosters.ts';
import type { Base } from '../db/index.ts';
import { limiter, type LimitesDebit } from '../limites.ts';
import { exigerJoueur, refuser } from './comptes.ts';

// Contrat : apps/api/openapi/boosters.yaml (US-023, ADR 0019 ; codes de boosters : US-070, ADR 0045).

const schemaBoosters = z.object({
  stock: z.int().min(0),
  plafond: z.int(),
  prochainDans: z.int().nullable(),
});

/** Le même refus pour un code inconnu, expiré, révoqué, épuisé ou déjà utilisé : il ne dit pas lequel. */
export const CODE_REFUSE =
  'Ce code ne donne pas de booster : inconnu, expiré, épuisé ou déjà utilisé';

export const routesBoosters: FastifyPluginAsyncZod<{
  base: Base;
  /** Clé secrète des codes (ADR 0025, 0045). */
  cleCodes: string;
  boosters?: OptionsBoosters;
  limites?: LimitesDebit;
}> = async (app, { base, cleCodes, boosters: options = {}, limites }) => {
  app.get(
    '/moi/boosters',
    { schema: { response: { 200: schemaBoosters } } },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      return connecte ? lireBoosters(base, connecte.joueur.id, options) : reponse;
    },
  );

  app.post(
    '/moi/boosters/ouvertures',
    {
      schema: {
        response: {
          201: z.object({
            cartes: z.array(z.object({ numero: z.int(), nouvelle: z.boolean() })),
            boosters: schemaBoosters,
          }),
        },
      },
    },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      const ouverture = await ouvrirUnBooster(base, connecte.joueur.id, options);
      if (!ouverture) return refuser(reponse, 409, 'Aucun booster en stock');
      return reponse.status(201).send(ouverture);
    },
  );

  app.post(
    '/moi/boosters/codes',
    {
      config: limiter(limites, 'codeBoosters'),
      schema: {
        body: z.object({ code: z.string().trim().min(1).max(64) }),
        response: {
          201: z.object({
            libelle: z.string(),
            offerts: z.int().min(1),
            boosters: schemaBoosters,
          }),
        },
      },
    },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      const joueur = connecte.joueur.id;
      const recus = await utiliserCodeBoosters(base, joueur, requete.body.code, cleCodes, options);
      if (!recus) return refuser(reponse, 403, CODE_REFUSE);
      // Jamais le code dans le journal : seulement qui a utilisé quel code.
      requete.log.info(
        { joueur, codeBoosters: recus.codeId, offerts: recus.offerts },
        'Code de boosters utilisé',
      );
      const { libelle, offerts, boosters } = recus;
      return reponse.status(201).send({ libelle, offerts, boosters });
    },
  );
};
