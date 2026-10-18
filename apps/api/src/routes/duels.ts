import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Base } from '../db/index.ts';
import {
  creerDuel,
  type DuelVisible,
  jouerDuel,
  lireDuel,
  type OptionsDuels,
  rejoindreDuel,
  type ResultatDuel,
} from '../duels/duels.ts';
import { schemaAction, schemaEvenement, schemaVue } from '../parties/schemas.ts';
import { exigerJoueur } from './comptes.ts';
import { versAction } from './parties.ts';

// Contrat : apps/api/openapi/duels.yaml (US-032, ADR 0020).

const PROBLEME = 'application/problem+json';

const schemaDuel = z.object({
  id: z.uuid(),
  statut: z.enum(['attente', 'en-cours', 'termine']),
  version: z.int(),
  createur: z.object({ pseudo: z.string() }),
  deckCreateur: z.string(),
  adversaire: z.object({ pseudo: z.string() }).nullable(),
  moi: z.enum(['j1', 'j2']).nullable(),
  curseur: z.int(),
  vue: schemaVue.nullable(),
  evenements: z.array(schemaEvenement),
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

export const routesDuels: FastifyPluginAsyncZod<{ base: Base; duels?: OptionsDuels }> = async (
  app,
  { base, duels: options = {} },
) => {
  const connecte = (requete: FastifyRequest, reponse: FastifyReply) =>
    exigerJoueur(base, requete, reponse);

  app.post(
    '/duels',
    { schema: { body: corpsDeck, response: { 201: schemaDuel } } },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      if (!session) return reponse;
      const resultat = await creerDuel(base, session.joueur.id, requete.body.deck);
      return resultat.ok ? envoyer(reponse, 201, resultat.valeur) : refuser(reponse, resultat);
    },
  );

  app.get(
    '/duels/:id',
    {
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
      );
      if (!resultat.ok) return refuser(reponse, resultat);
      if (versionDe(requete.headers['if-none-match']) === resultat.valeur.version) {
        return reponse.status(304).header('etag', etiquette(resultat.valeur.version)).send();
      }
      return envoyer(reponse, 200, resultat.valeur);
    },
  );

  app.post(
    '/duels/:id/rejoindre',
    { schema: { params: parametres, body: corpsDeck, response: { 200: schemaDuel } } },
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
    '/duels/:id/actions',
    { schema: { params: parametres, body: schemaAction, response: { 200: schemaDuel } } },
    async (requete, reponse) => {
      const session = await connecte(requete, reponse);
      if (!session) return reponse;
      const resultat = await jouerDuel(
        base,
        requete.params.id,
        session.joueur.id,
        versAction(requete.body),
        versionDe(requete.headers['if-match']),
      );
      return resultat.ok ? envoyer(reponse, 200, resultat.valeur) : refuser(reponse, resultat);
    },
  );
};
