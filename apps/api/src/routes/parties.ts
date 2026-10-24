import { type Action, DECKS_PRETES, NIVEAUX_BOT } from '@hipmaster/domain';
import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { empreinteJeton, joueurDuJeton } from '../comptes/comptes.ts';
import { type OptionsBoosters, type Recompense, recompenserVictoire } from '../comptes/boosters.ts';
import { cacheCatalogue } from '../cache-catalogue.ts';
import type { Base } from '../db/index.ts';
import { limiter, type LimitesDebit } from '../limites.ts';
import {
  conseillerPartie,
  estGuidee,
  jouerPartie,
  lancerPartie,
  lirePartie,
  type OptionsParties,
  type PartieLue,
  type PartieVisible,
  type ResultatPartie,
} from '../parties/parties.ts';
import { jetonDe, sessionDe } from './comptes.ts';
import {
  schemaAction,
  schemaConseil,
  schemaDeck,
  schemaNiveau,
  schemaPartie,
} from '../parties/schemas.ts';

const schemaPartieRecompensee = schemaPartie.extend({
  recompense: z
    .object({
      booster: z.boolean(),
      plafondAtteint: z.boolean(),
      motif: z.enum(['plafond', 'adversaire-deja-affronte']).nullable(),
    })
    .optional(),
});

// Contrat : apps/api/openapi/parties.yaml.

const PROBLEME = 'application/problem+json';

/** L'ETag d'une version de partie ou de duel. */
export const etiquette = (version: number) => `"${version}"`;

/** La version d'un en-tête `If-Match` ou `If-None-Match` (`"3"` ou `W/"3"`) ; `undefined` sinon. */
export function versionDe(entete: string | string[] | undefined): number | undefined {
  const valeur = Array.isArray(entete) ? entete[0] : entete;
  const correspondance = valeur?.match(/^(?:W\/)?"(\d+)"$/);
  return correspondance?.[1] === undefined ? undefined : Number(correspondance[1]);
}

/** Traduit un échec en Problem Details (RFC 9457). */
function refuser(reponse: FastifyReply, resultat: Exclude<ResultatPartie<unknown>, { ok: true }>) {
  const corps = (status: number, title: string, extra: object = {}) =>
    reponse
      .status(status)
      .type(PROBLEME)
      .send({ type: 'about:blank', title, status, ...extra });
  switch (resultat.raison) {
    case 'partie-inconnue':
      return corps(404, 'Partie introuvable ou expirée');
    case 'deck-inconnu':
      return corps(422, 'Deck inconnu');
    case 'niveau-inconnu':
      return corps(422, 'Niveau de bot inconnu');
    case 'version-perimee':
      return corps(409, 'La partie a changé : rechargez-la avant de jouer');
    case 'pas-votre-tour':
      return corps(409, 'Aucun conseil : ce n’est pas à vous de jouer');
    case 'action-refusee':
      return corps(422, 'Action refusée', {
        detail: resultat.erreur.message,
        code: resultat.erreur.code,
      });
  }
}

const parametres = z.object({ id: z.string().max(64) });

/** Zod garde `cible: undefined` quand elle est absente ; le domaine attend alors une propriété absente. */
export function versAction(corps: z.infer<typeof schemaAction>): Action {
  if (corps.type !== 'poser') return corps;
  const { cible, ...pose } = corps;
  return cible === undefined ? pose : { ...pose, cible };
}

/** Parties contre le bot, gardées en base (US-052, ADR 0030). */
export const routesParties: FastifyPluginAsyncZod<{
  base: Base;
  parties?: OptionsParties;
  boosters?: OptionsBoosters;
  limites?: LimitesDebit;
}> = async (app, options) => {
  const { base, parties = {}, boosters, limites } = options;

  /** Une partie gagnée par un joueur connecté rapporte un booster, une seule fois (US-025). */
  async function avecRecompense({
    partie,
    joueurId,
  }: PartieLue): Promise<PartieVisible & { recompense?: Recompense }> {
    // La partie guidée ne rapporte rien (US-067).
    if (!joueurId || estGuidee(partie.deck) || partie.vue.issue?.gagnant !== partie.vue.joueur) {
      return partie;
    }
    return {
      ...partie,
      recompense: await recompenserVictoire(base, partie.id, joueurId, boosters),
    };
  }

  async function envoyer(reponse: FastifyReply, lue: PartieLue) {
    const partie = await avecRecompense(lue);
    return reponse.header('etag', etiquette(partie.version)).send(partie);
  }

  // Decks et niveaux font partie du catalogue : en cache HTTP (US-057).
  app.get(
    '/decks',
    { ...cacheCatalogue, schema: { response: { 200: z.array(schemaDeck) } } },
    async () => DECKS_PRETES.map((deck) => ({ ...deck, cartes: [...deck.cartes] })),
  );

  app.get(
    '/niveaux',
    { ...cacheCatalogue, schema: { response: { 200: z.array(schemaNiveau) } } },
    async () => NIVEAUX_BOT.map(({ id, nom, description }) => ({ id, nom, description })),
  );

  app.post(
    '/parties',
    {
      config: limiter(limites, 'creationPartie'),
      schema: {
        body: z
          .object({
            deck: z.string().max(64).optional(),
            niveau: z.string().max(64).optional(),
            // La première partie guidée (US-067) : decks, graine et niveau fixés par le serveur.
            guidee: z.boolean().default(false),
          })
          .refine((corps) => corps.guidee || corps.deck !== undefined, {
            message: 'Le deck est obligatoire, sauf pour la partie guidée.',
          }),
        response: { 201: schemaPartie },
      },
    },
    async (requete, reponse) => {
      // Connecté, le joueur pourra être récompensé, et la partie n'appartient qu'à sa session (US-047) ; sans compte
      // (ou session expirée), la partie reste jouable par qui connaît son identifiant.
      const jeton = jetonDe(requete);
      const joueur = jeton
        ? await joueurDuJeton(base, jeton, requete.server.optionsSessions)
        : null;
      const proprietaire =
        joueur && jeton ? { joueurId: joueur.id, session: empreinteJeton(jeton) } : null;
      const resultat = await lancerPartie(
        base,
        requete.body.deck ?? '',
        requete.body.niveau,
        proprietaire,
        parties,
        requete.body.guidee,
      );
      if (!resultat.ok) return refuser(reponse, resultat);
      return reponse
        .status(201)
        .header('etag', etiquette(resultat.valeur.version))
        .send(resultat.valeur);
    },
  );

  app.get(
    '/parties/:id',
    { schema: { params: parametres, response: { 200: schemaPartieRecompensee } } },
    async (requete, reponse) => {
      const resultat = await lirePartie(base, requete.params.id, sessionDe(requete), parties);
      return resultat.ok ? envoyer(reponse, resultat.valeur) : refuser(reponse, resultat);
    },
  );

  // Conseil (US-066, ADR 0040) : contre le bot seulement, les duels n'ont pas de route de conseil.
  app.get(
    '/parties/:id/conseil',
    {
      config: limiter(limites, 'conseilPartie'),
      schema: { params: parametres, response: { 200: schemaConseil } },
    },
    async (requete, reponse) => {
      const resultat = await conseillerPartie(base, requete.params.id, sessionDe(requete), parties);
      if (!resultat.ok) return refuser(reponse, resultat);
      return reponse.header('etag', etiquette(resultat.valeur.version)).send(resultat.valeur);
    },
  );

  app.post(
    '/parties/:id/actions',
    {
      config: limiter(limites, 'actionPartie'),
      schema: {
        params: parametres,
        body: schemaAction,
        response: { 200: schemaPartieRecompensee },
      },
    },
    async (requete, reponse) => {
      const resultat = await jouerPartie(
        base,
        requete.params.id,
        versAction(requete.body),
        sessionDe(requete),
        versionDe(requete.headers['if-match']),
        parties,
      );
      return resultat.ok ? envoyer(reponse, resultat.valeur) : refuser(reponse, resultat);
    },
  );
};
