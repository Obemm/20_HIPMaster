import { and, asc, count, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { invitations, joueurs } from '../db/schema.ts';
import {
  codeLisible,
  type Creation,
  creerJoueur,
  empreinteCode,
  type Transaction,
} from './comptes.ts';

/**
 * Inscription sur invitation (US-048, ADR 0027) : un code crée des comptes tant qu'il lui reste des utilisations et
 * qu'il n'a pas expiré. La base n'en garde que l'empreinte HMAC, avec la clé des codes de récupération (ADR 0025).
 * La commande `npm run invitation` et la page « Inviter » (US-072, ADR 0029) passent toutes deux par ce module.
 */

/** Longueur maximale d'un libellé. */
export const LIBELLE_MAX = 80;
/** Nombre maximal de comptes qu'une invitation peut créer. */
export const UTILISATIONS_MAX = 1000;
/** Adresse du jeu en production (ADR 0021), pour le lien à envoyer. */
export const SITE_PAR_DEFAUT = 'https://hipmaster.web.app';
/** Hors production, le front de développement (`npm run dev`), qui relaie /api vers l'API. */
export const SITE_DEVELOPPEMENT = 'http://localhost:4200';
const JOUR_MS = 24 * 60 * 60 * 1000;

/** Une date limite `AAAA-MM-JJ` vaut tout ce jour-là : l'invitation expire à minuit UTC, le lendemain. */
export function finDuJour(date: string): Date {
  return new Date(Date.parse(date) + JOUR_MS);
}

/** Le lien à envoyer : la page « Mon compte » du site, dont il remplit le code d'invitation. */
export function lienInvitation(code: string, site: string): string {
  const lien = new URL('/compte', site);
  lien.searchParams.set('invitation', code);
  return lien.href;
}

export interface NouvelleInvitation {
  /** Pour qui, pour quelle campagne : « équipe intégration », « démo du 12 novembre »… */
  libelle: string;
  /** Nombre de comptes que le code permet de créer. */
  utilisations: number;
  expireLe: Date;
}

export interface ResumeInvitation {
  id: string;
  libelle: string;
  utilisations: number;
  utilisationsMax: number;
  expireLe: Date;
  creeLe: Date;
  /** Instant de la révocation (US-072) ; `null` pour une invitation jamais révoquée. */
  revoqueeLe: Date | null;
  /** Comptes créés avec cette invitation et encore présents. */
  comptes: number;
}

/** `active` : le code crée encore des comptes ; sinon, pourquoi il n'en crée plus. */
export type StatutInvitation = 'active' | 'epuisee' | 'expiree' | 'revoquee';

/** Le statut d'une invitation à cet instant : la révocation prime sur l'expiration, qui prime sur l'épuisement. */
export function statutInvitation(
  invitation: Pick<
    ResumeInvitation,
    'utilisations' | 'utilisationsMax' | 'expireLe' | 'revoqueeLe'
  >,
  maintenant = new Date(),
): StatutInvitation {
  if (invitation.revoqueeLe) return 'revoquee';
  if (invitation.expireLe <= maintenant) return 'expiree';
  if (invitation.utilisations >= invitation.utilisationsMax) return 'epuisee';
  return 'active';
}

/** Crée une invitation ; renvoie son code, à montrer une seule fois : la base n'en garde que l'empreinte. */
export async function creerInvitation(
  base: Base,
  invitation: NouvelleInvitation,
  cle: string,
): Promise<{ id: string; code: string }> {
  const code = codeLisible(4);
  const [ligne] = await base
    .insert(invitations)
    .values({
      empreinteCode: empreinteCode(cle, 'invitation', code),
      libelle: invitation.libelle,
      utilisationsMax: invitation.utilisations,
      expireLe: invitation.expireLe,
    })
    .returning({ id: invitations.id });
  if (!ligne) throw new Error('Création de l’invitation impossible.');
  return { id: ligne.id, code };
}

/**
 * Compte une utilisation de l'invitation de ce code, s'il lui en reste et qu'elle n'a pas expiré ; renvoie son
 * identifiant, ou `null`. Une seule requête, qui verrouille la ligne : deux inscriptions simultanées ne dépassent
 * jamais le maximum.
 */
export async function utiliserInvitation(
  base: Base | Transaction,
  code: string,
  cle: string,
  maintenant = new Date(),
): Promise<string | null> {
  const [ligne] = await base
    .update(invitations)
    .set({ utilisations: sql`${invitations.utilisations} + 1` })
    .where(
      and(
        eq(invitations.empreinteCode, empreinteCode(cle, 'invitation', code)),
        lt(invitations.utilisations, invitations.utilisationsMax),
        gt(invitations.expireLe, maintenant),
      ),
    )
    .returning({ id: invitations.id });
  return ligne?.id ?? null;
}

/**
 * Crée un compte (`POST /joueurs`) : avec un code d'invitation, toujours vérifié, qui compte une utilisation dans la
 * même transaction que la création ; sans code, seulement si l'invitation n'est pas exigée. `null` : invitation
 * refusée (absente, inconnue, expirée ou épuisée), sans dire laquelle.
 */
export async function inscrire(
  base: Base,
  pseudo: string,
  cle: string,
  invitation: { code: string | undefined; exigee: boolean },
): Promise<Creation | null> {
  const { code, exigee } = invitation;
  if (code === undefined) return exigee ? null : creerJoueur(base, pseudo, cle);
  return base.transaction(async (tx) => {
    const invitationId = await utiliserInvitation(tx, code, cle);
    return invitationId ? creerJoueur(tx, pseudo, cle, invitationId) : null;
  });
}

/** Les invitations avec le nombre de comptes créés par chacune ; jamais leur empreinte. */
function resumes(base: Base) {
  return base
    .select({
      id: invitations.id,
      libelle: invitations.libelle,
      utilisations: invitations.utilisations,
      utilisationsMax: invitations.utilisationsMax,
      expireLe: invitations.expireLe,
      creeLe: invitations.creeLe,
      revoqueeLe: invitations.revoqueeLe,
      comptes: count(joueurs.id),
    })
    .from(invitations)
    .leftJoin(joueurs, eq(joueurs.invitationId, invitations.id))
    .groupBy(invitations.id)
    .$dynamic();
}

/** Les invitations, des plus anciennes aux plus récentes, avec le nombre de comptes créés par chacune. */
export async function listerInvitations(base: Base): Promise<ResumeInvitation[]> {
  return resumes(base).orderBy(asc(invitations.creeLe), asc(invitations.id));
}

/** Une invitation et le nombre de comptes qu'elle a créés ; `null` si aucune n'a cet identifiant. */
export async function lireInvitation(base: Base, id: string): Promise<ResumeInvitation | null> {
  const [invitation] = await resumes(base).where(eq(invitations.id, id));
  return invitation ?? null;
}

/**
 * Révoque une invitation (un code qui aurait fuité) : elle expire aussitôt, et garde l'instant de sa révocation
 * (US-072) ; les comptes déjà créés restent. `false` si aucune invitation en cours n'a cet identifiant (inconnue, déjà
 * expirée ou déjà révoquée).
 */
export async function revoquerInvitation(
  base: Base,
  id: string,
  maintenant = new Date(),
): Promise<boolean> {
  const revoquees = await base
    .update(invitations)
    .set({ expireLe: maintenant, revoqueeLe: maintenant })
    .where(
      and(
        eq(invitations.id, id),
        gt(invitations.expireLe, maintenant),
        isNull(invitations.revoqueeLe),
      ),
    )
    .returning({ id: invitations.id });
  return revoquees.length > 0;
}
