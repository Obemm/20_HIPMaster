import { and, asc, count, eq, gt, lt, sql } from 'drizzle-orm';
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
 */

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
  /** Comptes créés avec cette invitation et encore présents. */
  comptes: number;
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

/** Les invitations, des plus anciennes aux plus récentes, avec le nombre de comptes créés par chacune. */
export async function listerInvitations(base: Base): Promise<ResumeInvitation[]> {
  return base
    .select({
      id: invitations.id,
      libelle: invitations.libelle,
      utilisations: invitations.utilisations,
      utilisationsMax: invitations.utilisationsMax,
      expireLe: invitations.expireLe,
      creeLe: invitations.creeLe,
      comptes: count(joueurs.id),
    })
    .from(invitations)
    .leftJoin(joueurs, eq(joueurs.invitationId, invitations.id))
    .groupBy(invitations.id)
    .orderBy(asc(invitations.creeLe), asc(invitations.id));
}

/**
 * Révoque une invitation (un code qui aurait fuité) : elle expire aussitôt ; les comptes déjà créés restent. `false`
 * si aucune invitation en cours n'a cet identifiant (inconnue, ou déjà expirée).
 */
export async function revoquerInvitation(
  base: Base,
  id: string,
  maintenant = new Date(),
): Promise<boolean> {
  const revoquees = await base
    .update(invitations)
    .set({ expireLe: maintenant })
    .where(and(eq(invitations.id, id), gt(invitations.expireLe, maintenant)))
    .returning({ id: invitations.id });
  return revoquees.length > 0;
}
