import { REGLES_BOOSTERS, stockA } from '@hipmaster/domain';
import { and, asc, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { boostersOfferts, codesBoosters, joueurs } from '../db/schema.ts';
import { type EtatBoosters, type OptionsBoosters, versEtat } from './boosters.ts';
import { codeLisible, empreinteCode } from './comptes.ts';

/**
 * Boosters offerts par code (US-070, ADR 0045) : le porteur du projet récompense une réussite de l'équipe par un code,
 * qui offre des boosters à chaque joueur qui l'utilise, une fois par joueur, tant qu'il lui reste des utilisations et
 * qu'il n'a ni expiré ni été révoqué. La base n'en garde que l'empreinte HMAC (ADR 0025), et garde qui l'a utilisé.
 * La commande `npm run code-boosters` et la page « Offrir des boosters » passent toutes deux par ce module.
 */

/** Boosters qu'un code peut offrir à chaque joueur, au plus (contrainte `codes_boosters_boosters`). */
export const BOOSTERS_PAR_CODE_MAX = 20;

/** Le lien à transmettre : la page « Mes boosters » du site, dont il remplit le code. */
export function lienCodeBoosters(code: string, site: string): string {
  const lien = new URL('/boosters', site);
  lien.searchParams.set('code', code);
  return lien.href;
}

export interface NouveauCodeBoosters {
  /** La réussite récompensée : « 1re API publiée »… Le joueur qui utilise le code la voit. */
  libelle: string;
  /** Boosters offerts à chaque joueur. */
  boosters: number;
  /** Nombre de joueurs qui peuvent utiliser le code. */
  utilisations: number;
  expireLe: Date;
}

export interface ResumeCodeBoosters {
  id: string;
  libelle: string;
  boosters: number;
  utilisations: number;
  utilisationsMax: number;
  expireLe: Date;
  creeLe: Date;
  /** Instant de la révocation ; `null` pour un code jamais révoqué. */
  revoqueLe: Date | null;
}

/** `actif` : le code offre encore des boosters ; sinon, pourquoi il n'en offre plus. */
export type StatutCodeBoosters = 'actif' | 'epuise' | 'expire' | 'revoque';

/** Le statut d'un code à cet instant : la révocation prime sur l'expiration, qui prime sur l'épuisement. */
export function statutCodeBoosters(
  code: Pick<ResumeCodeBoosters, 'utilisations' | 'utilisationsMax' | 'expireLe' | 'revoqueLe'>,
  maintenant = new Date(),
): StatutCodeBoosters {
  if (code.revoqueLe) return 'revoque';
  if (code.expireLe <= maintenant) return 'expire';
  if (code.utilisations >= code.utilisationsMax) return 'epuise';
  return 'actif';
}

/** Crée un code ; renvoie le code, à montrer une seule fois : la base n'en garde que l'empreinte. */
export async function creerCodeBoosters(
  base: Base,
  nouveau: NouveauCodeBoosters,
  cle: string,
): Promise<{ id: string; code: string }> {
  const code = codeLisible(4);
  const [ligne] = await base
    .insert(codesBoosters)
    .values({
      empreinteCode: empreinteCode(cle, 'boosters', code),
      libelle: nouveau.libelle,
      boosters: nouveau.boosters,
      utilisationsMax: nouveau.utilisations,
      expireLe: nouveau.expireLe,
    })
    .returning({ id: codesBoosters.id });
  if (!ligne) throw new Error('Création du code de boosters impossible.');
  return { id: ligne.id, code };
}

/** Ce que reçoit le joueur qui utilise un code. */
export interface BoostersRecus {
  codeId: string;
  libelle: string;
  /** Boosters offerts par le code. */
  offerts: number;
  /** Le stock après réception. */
  boosters: EtatBoosters;
}

/** Le code a déjà servi à ce joueur : la transaction est annulée, l'utilisation comptée avec elle. */
class DejaUtilise extends Error {}

/**
 * Utilise un code pour ce joueur : compte une utilisation, garde la trace et ajoute les boosters au stock, quitte à
 * dépasser le plafond de recharge (ADR 0019), en une transaction. `null` : code inconnu, expiré, révoqué, épuisé ou
 * déjà utilisé par ce joueur, sans dire lequel ; rien n'est alors consommé.
 *
 * Le compteur se met à jour sous condition, ce qui verrouille la ligne du code : deux joueurs simultanés ne dépassent
 * jamais le maximum ; la clé primaire de la trace refuse une seconde utilisation par le même joueur.
 */
export async function utiliserCodeBoosters(
  base: Base,
  joueurId: string,
  code: string,
  cle: string,
  options: OptionsBoosters = {},
): Promise<BoostersRecus | null> {
  const regles = options.regles ?? REGLES_BOOSTERS;
  const maintenant = (options.maintenant ?? Date.now)();
  try {
    return await base.transaction(async (tx) => {
      const [utilise] = await tx
        .update(codesBoosters)
        .set({ utilisations: sql`${codesBoosters.utilisations} + 1` })
        .where(
          and(
            eq(codesBoosters.empreinteCode, empreinteCode(cle, 'boosters', code)),
            lt(codesBoosters.utilisations, codesBoosters.utilisationsMax),
            gt(codesBoosters.expireLe, new Date(maintenant)),
          ),
        )
        .returning({
          id: codesBoosters.id,
          libelle: codesBoosters.libelle,
          boosters: codesBoosters.boosters,
        });
      if (!utilise) return null;

      const traces = await tx
        .insert(boostersOfferts)
        .values({
          codeId: utilise.id,
          joueurId,
          boosters: utilise.boosters,
          recuLe: new Date(maintenant),
        })
        .onConflictDoNothing()
        .returning({ codeId: boostersOfferts.codeId });
      if (traces.length === 0) throw new DejaUtilise();

      // Le verrou du joueur sérialise ses boosters reçus, gagnés et ouverts (ADR 0019).
      const [ligne] = await tx
        .select({ stock: joueurs.boosters, depuis: joueurs.rechargeDepuis })
        .from(joueurs)
        .where(eq(joueurs.id, joueurId))
        .for('update');
      if (!ligne) throw new Error('Joueur introuvable.');
      const actuel = stockA(
        { stock: ligne.stock, depuis: ligne.depuis.getTime() },
        maintenant,
        regles,
      );
      const apres = { stock: actuel.stock + utilise.boosters, depuis: actuel.depuis };
      await tx
        .update(joueurs)
        .set({ boosters: apres.stock, rechargeDepuis: new Date(apres.depuis) })
        .where(eq(joueurs.id, joueurId));
      return {
        codeId: utilise.id,
        libelle: utilise.libelle,
        offerts: utilise.boosters,
        boosters: versEtat(stockA(apres, maintenant, regles), regles),
      };
    });
  } catch (erreur) {
    if (erreur instanceof DejaUtilise) return null;
    throw erreur;
  }
}

const colonnesResume = {
  id: codesBoosters.id,
  libelle: codesBoosters.libelle,
  boosters: codesBoosters.boosters,
  utilisations: codesBoosters.utilisations,
  utilisationsMax: codesBoosters.utilisationsMax,
  expireLe: codesBoosters.expireLe,
  creeLe: codesBoosters.creeLe,
  revoqueLe: codesBoosters.revoqueLe,
};

/** Les codes, des plus anciens aux plus récents ; jamais leur empreinte. */
export async function listerCodesBoosters(base: Base): Promise<ResumeCodeBoosters[]> {
  return base
    .select(colonnesResume)
    .from(codesBoosters)
    .orderBy(asc(codesBoosters.creeLe), asc(codesBoosters.id));
}

/** Un code ; `null` si aucun n'a cet identifiant. */
export async function lireCodeBoosters(base: Base, id: string): Promise<ResumeCodeBoosters | null> {
  const [code] = await base
    .select(colonnesResume)
    .from(codesBoosters)
    .where(eq(codesBoosters.id, id));
  return code ?? null;
}

export interface Beneficiaire {
  joueurId: string;
  pseudo: string;
  boosters: number;
  recuLe: Date;
}

/**
 * Les joueurs qui ont utilisé ce code, du premier au dernier (comptes supprimés exclus) ; `null` si aucun code n'a
 * cet identifiant.
 */
export async function beneficiairesCodeBoosters(
  base: Base,
  id: string,
): Promise<Beneficiaire[] | null> {
  if (!(await lireCodeBoosters(base, id))) return null;
  return base
    .select({
      joueurId: boostersOfferts.joueurId,
      pseudo: joueurs.pseudo,
      boosters: boostersOfferts.boosters,
      recuLe: boostersOfferts.recuLe,
    })
    .from(boostersOfferts)
    .innerJoin(joueurs, eq(joueurs.id, boostersOfferts.joueurId))
    .where(eq(boostersOfferts.codeId, id))
    .orderBy(asc(boostersOfferts.recuLe), asc(joueurs.pseudo));
}

/**
 * Révoque un code (qui aurait fuité) : il expire aussitôt et garde l'instant de sa révocation ; les boosters déjà reçus
 * restent. `false` si aucun code en cours n'a cet identifiant (inconnu, déjà expiré ou déjà révoqué).
 */
export async function revoquerCodeBoosters(
  base: Base,
  id: string,
  maintenant = new Date(),
): Promise<boolean> {
  const revoques = await base
    .update(codesBoosters)
    .set({ expireLe: maintenant, revoqueLe: maintenant })
    .where(
      and(
        eq(codesBoosters.id, id),
        gt(codesBoosters.expireLe, maintenant),
        isNull(codesBoosters.revoqueLe),
      ),
    )
    .returning({ id: codesBoosters.id });
  return revoques.length > 0;
}
