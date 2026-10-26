import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Base } from '../db/index.ts';
import {
  creerDeck,
  type DeckJoueur,
  lireDecks,
  modifierDeck,
  REGLES_DECK,
  type ResultatDeck,
  supprimerDeck,
} from '../decks/decks.ts';
import { limiter, type LimitesDebit } from '../limites.ts';
import { PROBLEME, probleme } from '../problemes.ts';
import { exigerJoueur, refuser } from './comptes.ts';

// Contrat : apps/api/openapi/mes-decks.yaml (US-083, ADR 0048).

const schemaDeck = z.object({
  id: z.uuid(),
  nom: z.string(),
  cartes: z.array(z.int()),
  complet: z.boolean(),
  liberees: z.int().min(0),
  majLe: z.date(),
});

const corpsDeck = z.object({
  nom: z.string().trim().min(1).max(30),
  // Assez large pour qu'un deck trop grand soit refusé par les règles du domaine, avec leur code (`deck-taille`).
  cartes: z.array(z.int()).max(40),
});

const parametres = z.object({ id: z.uuid() });

/** Le code stable d'un deck refusé : celui de son premier problème (US-082). */
const CODES_PROBLEME = {
  taille: 'deck-taille',
  'carte-inconnue': 'deck-carte-inconnue',
  exemplaires: 'deck-exemplaires',
  'non-possedee': 'deck-carte-non-possedee',
} as const;

const TITRES_PROBLEME = {
  taille: 'Un deck compte 20 cartes au plus',
  'carte-inconnue': 'Une carte du deck n’existe pas',
  exemplaires: 'Trop d’exemplaires d’une même carte',
  'non-possedee': 'Une carte du deck n’est pas dans votre collection',
} as const;

/** Traduit un échec en Problem Details ; un deck invalide porte la liste de ses problèmes. */
function refuserDeck(
  reponse: FastifyReply,
  resultat: Exclude<ResultatDeck<unknown>, { ok: true }>,
) {
  switch (resultat.raison) {
    case 'plafond':
      return refuser(
        reponse,
        409,
        'decks-plafond',
        `${REGLES_DECK.decksMax} decks au plus : supprimez-en un pour en créer un autre`,
      );
    case 'introuvable':
      return refuser(reponse, 404, 'deck-introuvable', 'Deck introuvable');
    case 'invalide': {
      const [premier] = resultat.problemes;
      const code = premier ? CODES_PROBLEME[premier.code] : 'requete-invalide';
      const titre = premier ? TITRES_PROBLEME[premier.code] : 'Deck invalide';
      return reponse
        .status(422)
        .type(PROBLEME)
        .send({ ...probleme(422, code, titre), problemes: resultat.problemes });
    }
  }
}

/** Mes decks (US-083) : 5 au plus, composés avec ma collection, vérifiés par le domaine (ADR 0004, 0048). */
export const routesDecks: FastifyPluginAsyncZod<{ base: Base; limites?: LimitesDebit }> = async (
  app,
  { base, limites },
) => {
  const ecriture = limiter(limites, 'ecritureDeck');
  const envoyer = (reponse: FastifyReply, status: number, resultat: ResultatDeck<DeckJoueur>) =>
    resultat.ok ? reponse.status(status).send(resultat.valeur) : refuserDeck(reponse, resultat);

  app.get(
    '/moi/decks',
    {
      schema: {
        response: {
          200: z.object({
            regles: z.object({
              taille: z.int(),
              exemplairesMax: z.int(),
              exemplairesMaxLegendaire: z.int(),
              decksMax: z.int(),
            }),
            decks: z.array(schemaDeck),
          }),
        },
      },
    },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      return { regles: REGLES_DECK, decks: await lireDecks(base, connecte.joueur.id) };
    },
  );

  app.post(
    '/moi/decks',
    { config: ecriture, schema: { body: corpsDeck, response: { 201: schemaDeck } } },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      return envoyer(reponse, 201, await creerDeck(base, connecte.joueur.id, requete.body));
    },
  );

  app.put(
    '/moi/decks/:id',
    {
      config: ecriture,
      schema: { params: parametres, body: corpsDeck, response: { 200: schemaDeck } },
    },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      const resultat = await modifierDeck(
        base,
        connecte.joueur.id,
        requete.params.id,
        requete.body,
      );
      return envoyer(reponse, 200, resultat);
    },
  );

  app.delete(
    '/moi/decks/:id',
    { config: ecriture, schema: { params: parametres, response: { 204: z.null() } } },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      if (!(await supprimerDeck(base, connecte.joueur.id, requete.params.id))) {
        return refuserDeck(reponse, { ok: false, raison: 'introuvable' });
      }
      return reponse.status(204).send(null);
    },
  );
};
