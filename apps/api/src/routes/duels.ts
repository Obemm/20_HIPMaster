import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Base } from '../db/index.ts';
import { limiter, type LimitesDebit } from '../limites.ts';
import {
  abandonnerDuel,
  annulerDuel,
  chercherAdversaire,
  creerDuel,
  type DuelVisible,
  jouerDuel,
  lireDuel,
  lireMesDuels,
  type OptionsDuels,
  rejoindreDuel,
  type ResultatDuel,
} from '../duels/duels.ts';
import { schemaAction, schemaEvenement, schemaVue } from '../parties/schemas.ts';
import { exigerJoueur } from './comptes.ts';
import { versAction } from './parties.ts';

// Contrat : apps/api/openapi/duels.yaml (US-032, ADR 0020 ; limites de débit : US-047, ADR 0025).

const PROBLEME = 'application/problem+json';

const schemaDuel = z.object({
  id: z.uuid(),
  statut: z.enum(['attente', 'en-cours', 'termine']),
  version: z.int(),
  createur: z.object({ pseudo: z.string() }),
  deckCreateur: z.string(),
  ouvert: z.boolean(),
  adversaire: z.object({ pseudo: z.string() }).nullable(),
  moi: z.enum(['j1', 'j2']).nullable(),
  curseur: z.int(),
  echeance: z.iso.datetime().nullable(),
  vue: schemaVue.nullable(),
  evenements: z.array(schemaEvenement),
  recompense: z
    .object({
      booster: z.boolean(),
      plafondAtteint: z.boolean(),
      motif: z.enum(['plafond', 'adversaire-deja-affronte']).nullable(),
    })
    .optional(),
});

const parametres = z.object({ id: z.uuid() });
const corpsDeck = z.object({ deck: z.string().max(64) });

const etiquette = (version: number) => `"${version}"`;

/** La version d'un en-tête `If-Match` ou `If-None-Match` (`"3"` ou `W/"3"`) ; `undefined` sinon. */
function versionDe(entete: string | string[] | undefined): number | undefined {
  const valeur = Array.isArray(entete) ? entete[0] : entete;
  const correspondance = valeur?.match(/^(?:W\/)?"(\d+)"$/);
  return correspondance?.[1] === undefined ? undefined : Number(correspondance[1]);
}

/** Traduit un échec en Problem Details (RFC 9457). */
function refuser(reponse: FastifyReply, resultat: Exclude<ResultatDuel<unknown>, { ok: true }>) {
  const corps = (status: number, title: string, extra: object = {}) =>
    reponse
      .status(status)
      .type(PROBLEME)
      .send({ type: 'about:blank', title, status, ...extra });
  switch (resultat.raison) {
    case 'introuvable':
      return corps(404, 'Duel introuvable');
    case 'deck-inconnu':
      return corps(422, 'Deck inconnu');
    case 'deja-commence':
      return corps(409, 'Ce duel a déjà commencé');
    case 'son-propre-duel':
      return corps(409, 'Impossible de rejoindre son propre duel');
    case 'pas-commence':
      return corps(409, 'Le duel attend encore un adversaire');
    case 'pas-ton-tour':
      return corps(409, 'Ce n’est pas votre tour');
    case 'version-perimee':
      return corps(409, 'Le duel a changé : rechargez-le avant de jouer');
    case 'expire':
      return corps(410, 'Ce défi a expiré');
    case 'deja-termine':
      return corps(409, 'Ce duel est déjà terminé');
    case 'action-refusee':
      return corps(422, 'Action refusée', {
        detail: resultat.erreur.message,
        code: resultat.erreur.code,
      });
  }
}

function envoyer(reponse: FastifyReply, statut: number, duel: DuelVisible) {
  return reponse.status(statut).header('etag', etiquette(duel.version)).send(duel);
}

export const routesDuels: FastifyPluginAsyncZod<{
  base: Base;
  duels?: OptionsDuels;
  limites?: LimitesDebit;
}> = async (app, { base, duels: options = {}, limites }) => {
  const connecte = (requete: FastifyRequest, reponse: FastifyReply) =>
    exigerJoueur(base, requete, reponse);
  const creation = limiter(limites, 'creationDuel');
  const coup = limiter(limites, 'coupDuel');
  const lecture = limiter(limites, 'lectureDuel');

  app.post(
    '/duels',
    { config: creation, schema: { body: corpsDeck, response: { 201: schemaDuel } } },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      if (!session) return reponse;
      const resultat = await creerDuel(base, session.joueur.id, requete.body.deck);
      return resultat.ok ? envoyer(reponse, 201, resultat.valeur) : refuser(reponse, resultat);
    },
  );

  app.post(
    '/duels/hasard',
    {
      config: creation,
      schema: { body: corpsDeck, response: { 200: schemaDuel, 201: schemaDuel } },
    },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      if (!session) return reponse;
      const resultat = await chercherAdversaire(
        base,
        session.joueur.id,
        requete.body.deck,
        options,
      );
      if (!resultat.ok) return refuser(reponse, resultat);
      // 201 : un duel ouvert a été créé, le joueur attend ; 200 : il a rejoint un duel, qui commence.
      return envoyer(reponse, resultat.valeur.enAttente ? 201 : 200, resultat.valeur.duel);
    },
  );

  app.get(
    '/moi/duels',
    {
      config: lecture,
      schema: {
        response: {
          200: z.object({
            aMonTour: z.int().min(0),
            duels: z.array(
              z.object({
                id: z.uuid(),
                statut: z.enum(['attente', 'en-cours', 'termine']),
                adversaire: z.object({ pseudo: z.string() }).nullable(),
                monTour: z.boolean(),
                tour: z.int().nullable(),
                resultat: z.enum(['victoire', 'defaite', 'nulle']).nullable(),
                raison: z.enum(['sla', 'tours', 'abandon', 'forfait']).nullable(),
                majLe: z.iso.datetime(),
                echeance: z.iso.datetime().nullable(),
              }),
            ),
          }),
        },
      },
    },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      return session ? lireMesDuels(base, session.joueur.id, options) : reponse;
    },
  );

  app.get(
    '/duels/:id',
    {
      config: lecture,
      schema: {
        params: parametres,
        querystring: z.object({ depuis: z.coerce.number().int().min(0).default(0) }),
        // 304 : rien n'a changé depuis l'ETag connu (ADR 0020), réponse sans corps.
        response: { 200: schemaDuel, 304: z.void() },
      },
    },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      if (!session) return reponse;
      const resultat = await lireDuel(
        base,
        requete.params.id,
        session.joueur.id,
        requete.query.depuis,
        options,
      );
      if (!resultat.ok) return refuser(reponse, resultat);
      if (versionDe(requete.headers['if-none-match']) === resultat.valeur.version) {
        return reponse.status(304).header('etag', etiquette(resultat.valeur.version)).send();
      }
      return envoyer(reponse, 200, resultat.valeur);
    },
  );

  app.delete(
    '/duels/:id',
    { config: coup, schema: { params: parametres } },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      if (!session) return reponse;
      const resultat = await annulerDuel(base, requete.params.id, session.joueur.id);
      return resultat.ok ? reponse.status(204).send() : refuser(reponse, resultat);
    },
  );

  app.post(
    '/duels/:id/rejoindre',
    {
      config: coup,
      schema: { params: parametres, body: corpsDeck, response: { 200: schemaDuel } },
    },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      if (!session) return reponse;
      const resultat = await rejoindreDuel(
        base,
        requete.params.id,
        session.joueur.id,
        requete.body.deck,
        options,
      );
      return resultat.ok ? envoyer(reponse, 200, resultat.valeur) : refuser(reponse, resultat);
    },
  );

  app.post(
    '/duels/:id/abandon',
    { config: coup, schema: { params: parametres, response: { 200: schemaDuel } } },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      if (!session) return reponse;
      const resultat = await abandonnerDuel(base, requete.params.id, session.joueur.id, options);
      return resultat.ok ? envoyer(reponse, 200, resultat.valeur) : refuser(reponse, resultat);
    },
  );

  app.post(
    '/duels/:id/actions',
    {
      config: coup,
      schema: { params: parametres, body: schemaAction, response: { 200: schemaDuel } },
    },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      if (!session) return reponse;
      const resultat = await jouerDuel(
        base,
        requete.params.id,
        session.joueur.id,
        versAction(requete.body),
        versionDe(requete.headers['if-match']),
        options,
      );
      return resultat.ok ? envoyer(reponse, 200, resultat.valeur) : refuser(reponse, resultat);
    },
  );
};
