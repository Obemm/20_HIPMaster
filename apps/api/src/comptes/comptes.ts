import { createHash, createHmac, randomBytes, randomInt } from 'node:crypto';
import { REGLES_BOOSTERS } from '@hipmaster/domain';
import { and, eq, gt, lte, ne } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { joueurs, sessions } from '../db/schema.ts';
import { oublierDuelsSansJoueur, quitterSesDuels } from '../duels/duels.ts';

/**
 * Comptes invités (US-022, ADR 0017) : jetons de session et codes de récupération, jamais stockés en clair. Les codes
 * sont protégés par une clé secrète (HMAC), les sessions se révoquent (US-047, ADR 0025).
 */

export interface Joueur {
  id: string;
  pseudo: string;
}

/** Expiration des sessions (US-054, ADR 0035). */
export interface OptionsSessions {
  /** Durée sans usage au-delà de laquelle une session expire : 90 jours par défaut. */
  dureeMs?: number;
  /** Horloge, injectable pour les tests. */
  maintenant?: () => number;
}

const JOUR_MS = 24 * 60 * 60 * 1000;
/** Une session inutilisée 90 jours expire : le joueur se reconnecte avec son code de récupération (ADR 0031). */
export const DUREE_SESSION_MS = 90 * JOUR_MS;

/** Une transaction ouverte sur la base. */
export type Transaction = Parameters<Parameters<Base['transaction']>[0]>[0];

/**
 * Clé des codes en développement et en tests : publique, elle ne protège rien. En production, l'API refuse de démarrer
 * sans `CLE_CODES_RECUPERATION`, tirée au hasard et gardée dans Secret Manager (ADR 0025).
 */
export const CLE_CODES_DEVELOPPEMENT = 'hipmaster-developpement-cle-publique-des-codes';

/** 32 symboles sans caractères ambigus (ni I, O, 0, 1) : 5 bits par caractère, 20 bits par groupe de 4. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Ce que permet un code saisi par un humain (récupération d'un compte, invitation, ADR 0027) ; l'usage entre dans
 * l'empreinte, pour qu'un code ne vaille que pour lui.
 */
type UsageCode = 'recuperation' | 'invitation';

/** Forme canonique d'un code saisi : majuscules, sans espaces ni tirets. */
const normaliserCode = (code: string) => code.toUpperCase().replaceAll(/[^A-Z0-9]/g, '');

/** Empreinte d'un jeton de session : SHA-256 suffit à 256 bits aléatoires, qui ne se devinent pas (ADR 0017). */
export const empreinteJeton = (jeton: string) => createHash('sha256').update(jeton).digest('hex');

/**
 * Empreinte d'un code : HMAC-SHA-256 avec la clé secrète (ADR 0025). Sans la clé, une copie de la base ne permet pas
 * d'essayer des codes hors ligne, alors que 60 bits se parcourent.
 */
export const empreinteCode = (cle: string, usage: UsageCode, code: string) =>
  createHmac('sha256', cle)
    .update(`${usage}:${normaliserCode(code)}`)
    .digest('hex');

/**
 * Un code lisible en groupes de 4 caractères : « ABCD-EFGH-JKLM » pour un code de récupération (3 groupes, 60 bits),
 * un groupe de plus pour une invitation (80 bits).
 */
export function codeLisible(groupes: number): string {
  return Array.from({ length: groupes }, () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''),
  ).join('-');
}

const nouveauJeton = () => randomBytes(32).toString('base64url');

async function ouvrirSession(base: Base | Transaction, joueurId: string): Promise<string> {
  const jeton = nouveauJeton();
  await base.insert(sessions).values({ empreinteJeton: empreinteJeton(jeton), joueurId });
  return jeton;
}

/** Un compte créé : le jeton de sa première session et son code de récupération, montré une seule fois. */
export interface Creation {
  joueur: Joueur;
  jeton: string;
  codeRecuperation: string;
}

/**
 * Crée un compte invité ; renvoie le jeton de la première session et le code de récupération (une seule fois).
 * `invitationId` : l'invitation qui l'a permis, s'il y en a une (US-048).
 */
export async function creerJoueur(
  base: Base | Transaction,
  pseudo: string,
  cle: string,
  invitationId?: string,
): Promise<Creation> {
  const codeRecuperation = codeLisible(3);
  const [joueur] = await base
    .insert(joueurs)
    .values({
      pseudo,
      empreinteCode: empreinteCode(cle, 'recuperation', codeRecuperation),
      // Cadeau de bienvenue (US-023).
      boosters: REGLES_BOOSTERS.bienvenue,
      ...(invitationId && { invitationId }),
    })
    .returning({ id: joueurs.id, pseudo: joueurs.pseudo });
  if (!joueur) throw new Error('Création du joueur impossible.');
  return { joueur, jeton: await ouvrirSession(base, joueur.id), codeRecuperation };
}

/** Ouvre une session sur un nouvel appareil à partir du code de récupération ; `null` si le code est inconnu. */
export async function connecterParCode(
  base: Base,
  code: string,
  cle: string,
): Promise<{ joueur: Joueur; jeton: string } | null> {
  const [joueur] = await base
    .select({ id: joueurs.id, pseudo: joueurs.pseudo })
    .from(joueurs)
    .where(eq(joueurs.empreinteCode, empreinteCode(cle, 'recuperation', code)));
  if (!joueur) return null;
  return { joueur, jeton: await ouvrirSession(base, joueur.id) };
}

/**
 * Le joueur d'un jeton de session ; `null` si la session n'existe pas, ou plus, ou si elle a expiré faute d'usage
 * (US-054). Chaque usage prolonge la session, avec au plus une écriture par jour et par session : la plupart des
 * requêtes ne font que lire.
 */
export async function joueurDuJeton(
  base: Base,
  jeton: string,
  options: OptionsSessions = {},
): Promise<Joueur | null> {
  const maintenant = (options.maintenant ?? Date.now)();
  const empreinte = empreinteJeton(jeton);
  const [ligne] = await base
    .select({ id: joueurs.id, pseudo: joueurs.pseudo, utiliseeLe: sessions.utiliseeLe })
    .from(sessions)
    .innerJoin(joueurs, eq(sessions.joueurId, joueurs.id))
    .where(
      and(
        eq(sessions.empreinteJeton, empreinte),
        gt(sessions.utiliseeLe, new Date(maintenant - (options.dureeMs ?? DUREE_SESSION_MS))),
      ),
    );
  if (!ligne) return null;
  if (maintenant - ligne.utiliseeLe.getTime() >= JOUR_MS) {
    await base
      .update(sessions)
      .set({ utiliseeLe: new Date(maintenant) })
      .where(eq(sessions.empreinteJeton, empreinte));
  }
  return { id: ligne.id, pseudo: ligne.pseudo };
}

/**
 * Purge (US-054, ADR 0035) : supprime les sessions expirées faute d'usage, et avec elles les parties contre le bot
 * qu'elles avaient lancées (expirées depuis longtemps) ; renvoie le nombre de sessions supprimées. Le compte reste.
 */
export async function purgerSessionsExpirees(
  base: Base,
  options: OptionsSessions = {},
): Promise<number> {
  const limite = (options.maintenant ?? Date.now)() - (options.dureeMs ?? DUREE_SESSION_MS);
  const supprimees = await base
    .delete(sessions)
    .where(lte(sessions.utiliseeLe, new Date(limite)))
    .returning({ empreinte: sessions.empreinteJeton });
  return supprimees.length;
}

export async function fermerSession(base: Base, jeton: string): Promise<void> {
  await base.delete(sessions).where(eq(sessions.empreinteJeton, empreinteJeton(jeton)));
}

/**
 * Supprime définitivement le compte (US-053, ADR 0031), en une transaction : ses duels en cours se terminent par
 * forfait et ses défis en attente disparaissent, puis le compte part avec ses sessions, sa collection, ses récompenses
 * et ses parties contre le bot (clés étrangères en cascade). Ses duels terminés restent à ses adversaires.
 */
export async function supprimerCompte(base: Base, joueurId: string): Promise<void> {
  await base.transaction(async (tx) => {
    await quitterSesDuels(tx, joueurId);
    await tx.delete(joueurs).where(eq(joueurs.id, joueurId));
    await oublierDuelsSansJoueur(tx);
  });
}

/**
 * Ferme toutes les sessions du joueur sauf celle de `jeton`, l'appareil qui le demande (« Déconnecter mes autres
 * appareils », US-047) ; renvoie le nombre de sessions fermées.
 */
export async function fermerAutresSessions(
  base: Base | Transaction,
  joueurId: string,
  jeton: string,
): Promise<number> {
  const fermees = await base
    .delete(sessions)
    .where(and(eq(sessions.joueurId, joueurId), ne(sessions.empreinteJeton, empreinteJeton(jeton))))
    .returning({ joueurId: sessions.joueurId });
  return fermees.length;
}

/**
 * Remplace le code de récupération : l'ancien cesse aussitôt de fonctionner, et les autres sessions du joueur, qui ont
 * pu s'ouvrir avec lui, sont fermées dans la même transaction (US-047). La session de `jeton` reste ouverte.
 */
export async function regenererCode(
  base: Base,
  joueurId: string,
  jeton: string,
  cle: string,
): Promise<{ codeRecuperation: string; sessionsFermees: number }> {
  const codeRecuperation = codeLisible(3);
  return base.transaction(async (tx) => {
    await tx
      .update(joueurs)
      .set({ empreinteCode: empreinteCode(cle, 'recuperation', codeRecuperation) })
      .where(eq(joueurs.id, joueurId));
    return { codeRecuperation, sessionsFermees: await fermerAutresSessions(tx, joueurId, jeton) };
  });
}
