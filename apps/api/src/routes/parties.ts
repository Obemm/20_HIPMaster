import { type Action, DECKS_PRETES, NIVEAUX_BOT } from '@hipmaster/domain';
import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { joueurDuJeton } from '../comptes/comptes.ts';
import { type OptionsBoosters, type Recompense, recompenserVictoire } from '../comptes/boosters.ts';
import type { Base } from '../db/index.ts';
import type { DepotParties, PartieVisible, ResultatDepot } from '../parties/depot.ts';
import { jetonDe } from './comptes.ts';
import { schemaAction, schemaDeck, schemaNiveau, schemaPartie } from '../parties/schemas.ts';

const schemaPartieRecompensee = schemaPartie.extend({
  recompense: z.object({ booster: z.boolean(), plafondAtteint: z.boolean() }).optional(),
});

// Contrat : apps/api/openapi/parties.yaml.

const PROBLEME = 'application/problem+json';

/** Traduit un échec du dépôt en Problem Details (RFC 9457). */
function refuser(reponse: FastifyReply, resultat: Exclude<ResultatDepot<unknown>, { ok: true }>) {
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

export const routesParties: FastifyPluginAsyncZod<{
  depot: DepotParties;
  base?: Base;
  boosters?: OptionsBoosters;
}> = async (app, options) => {
  const { depot, base, boosters } = options;

  /** Une partie gagnée par un joueur connecté rapporte un booster, une seule fois (US-025). */
  async function avecRecompense(
    partie: PartieVisible,
  ): Promise<PartieVisible & { recompense?: Recompense }> {
    const joueurId = depot.proprietaire(partie.id);
    if (!base || !joueurId || partie.vue.issue?.gagnant !== partie.vue.joueur) return partie;
    return {
      ...partie,
      recompense: await recompenserVictoire(base, partie.id, joueurId, boosters),
    };
  }

  app.get('/decks', { schema: { response: { 200: z.array(schemaDeck) } } }, async () =>
    DECKS_PRETES.map((deck) => ({ ...deck, cartes: [...deck.cartes] })),
  );

  app.get('/niveaux', { schema: { response: { 200: z.array(schemaNiveau) } } }, async () =>
    NIVEAUX_BOT.map(({ id, nom, description }) => ({ id, nom, description })),
  );

  app.post(
    '/parties',
    {
      schema: {
        body: z.object({ deck: z.string().max(64), niveau: z.string().max(64).optional() }),
        response: { 201: schemaPartie },
      },
    },
    async (requete, reponse) => {
      // Connecté, le joueur pourra être récompensé ; sans compte (ou session expirée), la partie reste jouable.
      const jeton = base ? jetonDe(requete) : null;
      const joueur = base && jeton ? await joueurDuJeton(base, jeton) : null;
      const resultat = depot.creer(requete.body.deck, requete.body.niveau, joueur?.id);
      if (!resultat.ok) return refuser(reponse, resultat);
      return reponse.status(201).send(resultat.valeur);
    },
  );

  app.get(
    '/parties/:id',
    { schema: { params: parametres, response: { 200: schemaPartieRecompensee } } },
    async (requete, reponse) => {
      const resultat = depot.lire(requete.params.id);
      return resultat.ok ? avecRecompense(resultat.valeur) : refuser(reponse, resultat);
    },
  );

  app.post(
    '/parties/:id/actions',
    {
      schema: {
        params: parametres,
        body: schemaAction,
        response: { 200: schemaPartieRecompensee },
      },
    },
    async (requete, reponse) => {
      const resultat = depot.jouer(requete.params.id, versAction(requete.body));
      return resultat.ok ? avecRecompense(resultat.valeur) : refuser(reponse, resultat);
    },
  );
};
