import type { FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { type Administrateurs, estAdministrateur, TOUS } from '../comptes/administrateurs.ts';
import { joueurDuJeton } from '../comptes/comptes.ts';
import {
  creerInvitation,
  finDuJour,
  LIBELLE_MAX,
  lienInvitation,
  lireInvitation,
  listerInvitations,
  type ResumeInvitation,
  revoquerInvitation,
  statutInvitation,
  UTILISATIONS_MAX,
} from '../comptes/invitations.ts';
import type { Base } from '../db/index.ts';
import { limiter, type LimitesDebit } from '../limites.ts';
import { jetonDe, refuser } from './comptes.ts';

// Contrat : apps/api/openapi/administration.yaml (US-072, ADR 0029). Les invitations passent par les mêmes fonctions
// que la commande `npm run invitation` (ADR 0027).

const schemaInvitation = z.object({
  id: z.uuid(),
  libelle: z.string(),
  utilisations: z.int().min(0),
  utilisationsMax: z.int().min(1),
  comptes: z.int().min(0),
  creeLe: z.iso.datetime(),
  expireLe: z.iso.datetime(),
  revoqueeLe: z.iso.datetime().nullable(),
  statut: z.enum(['active', 'epuisee', 'expiree', 'revoquee']),
});

const parametres = z.object({ id: z.uuid() });

/** Une invitation telle que la voit l'administrateur : jamais son code ni son empreinte. */
function vue(
  invitation: ResumeInvitation,
  maintenant = new Date(),
): z.infer<typeof schemaInvitation> {
  return {
    id: invitation.id,
    libelle: invitation.libelle,
    utilisations: invitation.utilisations,
    utilisationsMax: invitation.utilisationsMax,
    comptes: invitation.comptes,
    creeLe: invitation.creeLe.toISOString(),
    expireLe: invitation.expireLe.toISOString(),
    revoqueeLe: invitation.revoqueeLe?.toISOString() ?? null,
    statut: statutInvitation(invitation, maintenant),
  };
}

export const routesAdministration: FastifyPluginAsyncZod<{
  base: Base;
  /** Clé secrète des codes d'invitation (ADR 0025, 0027). */
  cleCodes: string;
  administrateurs: Administrateurs;
  /** Adresse du site, pour le lien d'invitation. */
  site: string;
  limites?: LimitesDebit;
}> = async (app, { base, cleCodes, administrateurs, site, limites }) => {
  const administrateurDe = new WeakMap<FastifyRequest, string>();

  // Avant tout le reste (lecture du corps, validation, limite de débit) : à qui n'est pas administrateur, la réponse
  // exacte d'une route qui n'existe pas (ADR 0029). Ce crochet ne vaut que pour les routes de ce plugin.
  // Sans administrateur configuré, aucune session à vérifier : la base n'est pas interrogée.
  const personne = administrateurs !== TOUS && administrateurs.size === 0;
  app.addHook('onRequest', async (requete, reponse) => {
    const jeton = personne ? null : jetonDe(requete);
    const joueur = jeton ? await joueurDuJeton(base, jeton) : null;
    if (joueur && estAdministrateur(administrateurs, joueur.id)) {
      administrateurDe.set(requete, joueur.id);
      return;
    }
    reponse.callNotFound();
    return reponse;
  });

  const config = limiter(limites, 'administration');

  app.get(
    '/admin/invitations',
    {
      config,
      schema: { response: { 200: z.object({ invitations: z.array(schemaInvitation) }) } },
    },
    async () => {
      const maintenant = new Date();
      const invitations = await listerInvitations(base);
      // Les plus récentes d'abord : celle qu'on vient de créer, en haut de la page.
      return { invitations: invitations.reverse().map((i) => vue(i, maintenant)) };
    },
  );

  app.post(
    '/admin/invitations',
    {
      config,
      schema: {
        body: z.object({
          libelle: z.string().trim().min(1).max(LIBELLE_MAX),
          utilisations: z.int().min(1).max(UTILISATIONS_MAX),
          expire: z.iso.date(),
        }),
        response: {
          201: z.object({ invitation: schemaInvitation, code: z.string(), lien: z.url() }),
        },
      },
    },
    async (requete, reponse) => {
      const { libelle, utilisations, expire } = requete.body;
      const expireLe = finDuJour(expire);
      if (expireLe <= new Date()) return refuser(reponse, 400, 'La date limite est déjà passée');
      const { id, code } = await creerInvitation(
        base,
        { libelle, utilisations, expireLe },
        cleCodes,
      );
      const invitation = await lireInvitation(base, id);
      if (!invitation) throw new Error('Invitation créée introuvable.');
      // Jamais le code dans le journal : seulement qui a créé quelle invitation.
      requete.log.info(
        { administrateur: administrateurDe.get(requete), invitation: id, utilisations },
        'Invitation créée',
      );
      return reponse
        .status(201)
        .send({ invitation: vue(invitation), code, lien: lienInvitation(code, site) });
    },
  );

  app.post(
    '/admin/invitations/:id/revocation',
    { config, schema: { params: parametres, response: { 200: schemaInvitation } } },
    async (requete, reponse) => {
      const { id } = requete.params;
      const invitation = (await revoquerInvitation(base, id))
        ? await lireInvitation(base, id)
        : null;
      if (!invitation) {
        return refuser(
          reponse,
          404,
          'Aucune invitation en cours ne porte cet identifiant : inconnue, déjà expirée ou révoquée',
        );
      }
      requete.log.info(
        { administrateur: administrateurDe.get(requete), invitation: id },
        'Invitation révoquée',
      );
      return vue(invitation);
    },
  );
};
