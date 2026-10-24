import type { FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { type Administrateurs, estAdministrateur, TOUS } from '../comptes/administrateurs.ts';
import {
  beneficiairesCodeBoosters,
  BOOSTERS_PAR_CODE_MAX,
  creerCodeBoosters,
  lienCodeBoosters,
  lireCodeBoosters,
  listerCodesBoosters,
  type ResumeCodeBoosters,
  revoquerCodeBoosters,
  statutCodeBoosters,
} from '../comptes/codes-boosters.ts';
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
// que la commande `npm run invitation` (ADR 0027), les codes de boosters par celles de `npm run code-boosters`
// (US-070, ADR 0045).

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

const schemaCodeBoosters = z.object({
  id: z.uuid(),
  libelle: z.string(),
  boosters: z.int().min(1),
  utilisations: z.int().min(0),
  utilisationsMax: z.int().min(1),
  creeLe: z.iso.datetime(),
  expireLe: z.iso.datetime(),
  revoqueLe: z.iso.datetime().nullable(),
  statut: z.enum(['actif', 'epuise', 'expire', 'revoque']),
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

/** Un code de boosters tel que le voit l'administrateur : jamais le code ni son empreinte. */
function vueCode(
  code: ResumeCodeBoosters,
  maintenant = new Date(),
): z.infer<typeof schemaCodeBoosters> {
  return {
    id: code.id,
    libelle: code.libelle,
    boosters: code.boosters,
    utilisations: code.utilisations,
    utilisationsMax: code.utilisationsMax,
    creeLe: code.creeLe.toISOString(),
    expireLe: code.expireLe.toISOString(),
    revoqueLe: code.revoqueLe?.toISOString() ?? null,
    statut: statutCodeBoosters(code, maintenant),
  };
}

const CODE_INCONNU = 'Aucun code de boosters ne porte cet identifiant';

export const routesAdministration: FastifyPluginAsyncZod<{
  base: Base;
  /** Clé secrète des codes d'invitation et de boosters (ADR 0025, 0027, 0045). */
  cleCodes: string;
  administrateurs: Administrateurs;
  /** Adresse du site, pour les liens d'invitation et de boosters. */
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
    const joueur = jeton ? await joueurDuJeton(base, jeton, requete.server.optionsSessions) : null;
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
      if (expireLe <= new Date())
        return refuser(reponse, 400, 'date-limite-passee', 'La date limite est déjà passée');
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
          'invitation-inconnue',
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

  app.get(
    '/admin/codes-boosters',
    {
      config,
      schema: { response: { 200: z.object({ codes: z.array(schemaCodeBoosters) }) } },
    },
    async () => {
      const maintenant = new Date();
      const codes = await listerCodesBoosters(base);
      // Les plus récents d'abord, comme les invitations.
      return { codes: codes.reverse().map((c) => vueCode(c, maintenant)) };
    },
  );

  app.post(
    '/admin/codes-boosters',
    {
      config,
      schema: {
        body: z.object({
          libelle: z.string().trim().min(1).max(LIBELLE_MAX),
          boosters: z.int().min(1).max(BOOSTERS_PAR_CODE_MAX),
          utilisations: z.int().min(1).max(UTILISATIONS_MAX),
          expire: z.iso.date(),
        }),
        response: {
          201: z.object({ codeBoosters: schemaCodeBoosters, code: z.string(), lien: z.url() }),
        },
      },
    },
    async (requete, reponse) => {
      const { libelle, boosters, utilisations, expire } = requete.body;
      const expireLe = finDuJour(expire);
      if (expireLe <= new Date()) {
        return refuser(reponse, 400, 'date-limite-passee', 'La date limite est déjà passée');
      }
      const { id, code } = await creerCodeBoosters(
        base,
        { libelle, boosters, utilisations, expireLe },
        cleCodes,
      );
      const codeBoosters = await lireCodeBoosters(base, id);
      if (!codeBoosters) throw new Error('Code de boosters créé introuvable.');
      // Jamais le code dans le journal : seulement qui a créé quel code.
      requete.log.info(
        { administrateur: administrateurDe.get(requete), codeBoosters: id, boosters, utilisations },
        'Code de boosters créé',
      );
      return reponse
        .status(201)
        .send({ codeBoosters: vueCode(codeBoosters), code, lien: lienCodeBoosters(code, site) });
    },
  );

  app.get(
    '/admin/codes-boosters/:id/beneficiaires',
    {
      config,
      schema: {
        params: parametres,
        response: {
          200: z.object({
            beneficiaires: z.array(
              z.object({
                joueurId: z.uuid(),
                pseudo: z.string(),
                boosters: z.int().min(1),
                recuLe: z.iso.datetime(),
              }),
            ),
          }),
        },
      },
    },
    async (requete, reponse) => {
      const beneficiaires = await beneficiairesCodeBoosters(base, requete.params.id);
      if (!beneficiaires) return refuser(reponse, 404, 'code-boosters-inconnu', CODE_INCONNU);
      return {
        beneficiaires: beneficiaires.map((b) => ({ ...b, recuLe: b.recuLe.toISOString() })),
      };
    },
  );

  app.post(
    '/admin/codes-boosters/:id/revocation',
    { config, schema: { params: parametres, response: { 200: schemaCodeBoosters } } },
    async (requete, reponse) => {
      const { id } = requete.params;
      const code = (await revoquerCodeBoosters(base, id)) ? await lireCodeBoosters(base, id) : null;
      if (!code) {
        return refuser(
          reponse,
          404,
          'code-boosters-inconnu',
          'Aucun code de boosters en cours ne porte cet identifiant : inconnu, déjà expiré ou révoqué',
        );
      }
      requete.log.info(
        { administrateur: administrateurDe.get(requete), codeBoosters: id },
        'Code de boosters révoqué',
      );
      return vueCode(code);
    },
  );
};
