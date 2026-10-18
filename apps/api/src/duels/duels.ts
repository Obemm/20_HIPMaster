import { randomInt } from 'node:crypto';
import {
  type Action,
  appliquer,
  creerPartie,
  type EntreeJournal,
  type ErreurAction,
  type IdJoueur,
  journalDe,
  trouverDeckPrete,
  vueDe,
  type VueJoueur,
} from '@hipmaster/domain';
import { eq, inArray } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { duels, joueurs } from '../db/schema.ts';

/** Duels entre joueurs (US-032, ADR 0020) : l'état vit en base, chacun ne reçoit que sa vue. */

type LigneDuel = typeof duels.$inferSelect;
export type StatutDuel = LigneDuel['statut'];

export interface DuelVisible {
  id: string;
  statut: StatutDuel;
  version: number;
  createur: { pseudo: string };
  deckCreateur: string;
  adversaire: { pseudo: string } | null;
  /** Le camp du joueur qui demande ; `null` s'il ne participe pas. */
  moi: IdJoueur | null;
  /** Longueur du journal : à repasser dans `depuis` pour ne recevoir que les nouveaux événements. */
  curseur: number;
  vue: Omit<VueJoueur, 'journal'> | null;
  evenements: EntreeJournal[];
}

export type ResultatDuel<T> =
  | { ok: true; valeur: T }
  | {
      ok: false;
      raison:
        | 'introuvable'
        | 'deck-inconnu'
        | 'deja-commence'
        | 'son-propre-duel'
        | 'pas-commence'
        | 'pas-ton-tour'
        | 'version-perimee'
        | 'expire';
    }
  | { ok: false; raison: 'action-refusee'; erreur: ErreurAction };

export interface OptionsDuels {
  /** Graine de chaque duel, injectable pour des duels reproductibles. */
  tirerGraine?: () => number;
  /** Horloge, injectable pour les tests. */
  maintenant?: () => number;
  /** Durée de vie d'un défi non accepté (7 jours par défaut, US-033). */
  expirationDefiMs?: number;
}

const SEPT_JOURS = 7 * 24 * 60 * 60 * 1000;

/** Un défi non accepté expire (US-033) ; l'expiration est évaluée à la lecture, sans tâche de fond (ADR 0020). */
function defiExpire(ligne: LigneDuel, options: OptionsDuels): boolean {
  const maintenant = (options.maintenant ?? Date.now)();
  return (
    ligne.statut === 'attente' &&
    maintenant - ligne.creeLe.getTime() > (options.expirationDefiMs ?? SEPT_JOURS)
  );
}

const echec = <R extends Exclude<ResultatDuel<never>, { ok: true }>['raison']>(raison: R) =>
  ({ ok: false, raison }) as const;

/** Le camp d'un joueur dans un duel : le créateur joue j1, l'adversaire j2. */
function campDe(ligne: LigneDuel, joueurId: string): IdJoueur | null {
  if (ligne.createurId === joueurId) return 'j1';
  if (ligne.adversaireId === joueurId) return 'j2';
  return null;
}

async function pseudos(base: Base, ligne: LigneDuel): Promise<Map<string, string>> {
  const ids = [ligne.createurId, ...(ligne.adversaireId ? [ligne.adversaireId] : [])];
  const lignes = await base
    .select({ id: joueurs.id, pseudo: joueurs.pseudo })
    .from(joueurs)
    .where(inArray(joueurs.id, ids));
  return new Map(lignes.map((l) => [l.id, l.pseudo]));
}

async function visible(
  base: Base,
  ligne: LigneDuel,
  joueurId: string,
  depuis: number,
): Promise<DuelVisible> {
  const noms = await pseudos(base, ligne);
  const moi = campDe(ligne, joueurId);
  const etat = ligne.etat;
  let vue: DuelVisible['vue'] = null;
  if (etat && moi) {
    const { joueur, moi: camp, adversaire, actif, tour, issue, actions } = vueDe(etat, moi);
    vue = { joueur, moi: camp, adversaire, actif, tour, issue, actions };
  }
  return {
    id: ligne.id,
    statut: ligne.statut,
    version: ligne.version,
    createur: { pseudo: noms.get(ligne.createurId) ?? '?' },
    deckCreateur: ligne.deckCreateur,
    adversaire: ligne.adversaireId ? { pseudo: noms.get(ligne.adversaireId) ?? '?' } : null,
    moi,
    curseur: etat?.journal.length ?? 0,
    vue,
    evenements: etat && moi ? journalDe(etat.journal.slice(depuis), moi) : [],
  };
}

export async function creerDuel(
  base: Base,
  joueurId: string,
  idDeck: string,
): Promise<ResultatDuel<DuelVisible>> {
  if (!trouverDeckPrete(idDeck)) return echec('deck-inconnu');
  const [ligne] = await base
    .insert(duels)
    .values({ createurId: joueurId, deckCreateur: idDeck })
    .returning();
  if (!ligne) throw new Error('Création du duel impossible.');
  return { ok: true, valeur: await visible(base, ligne, joueurId, 0) };
}

/**
 * Un participant voit le duel ; un autre joueur ne voit qu'un duel en attente (pour le rejoindre), jamais un duel
 * commencé.
 */
export async function lireDuel(
  base: Base,
  id: string,
  joueurId: string,
  depuis = 0,
  options: OptionsDuels = {},
): Promise<ResultatDuel<DuelVisible>> {
  const [ligne] = await base.select().from(duels).where(eq(duels.id, id));
  if (!ligne || (!campDe(ligne, joueurId) && ligne.statut !== 'attente')) {
    return echec('introuvable');
  }
  if (defiExpire(ligne, options)) return echec('expire');
  return { ok: true, valeur: await visible(base, ligne, joueurId, depuis) };
}

/** Rejoint un duel en attente : la partie est créée, le tirage désigne qui commence. */
export async function rejoindreDuel(
  base: Base,
  id: string,
  joueurId: string,
  idDeck: string,
  options: OptionsDuels = {},
): Promise<ResultatDuel<DuelVisible>> {
  const deck = trouverDeckPrete(idDeck);
  if (!deck) return echec('deck-inconnu');
  const resultat = await base.transaction(async (tx) => {
    const [ligne] = await tx.select().from(duels).where(eq(duels.id, id)).for('update');
    if (!ligne) return echec('introuvable');
    if (ligne.createurId === joueurId) return echec('son-propre-duel');
    if (ligne.statut !== 'attente') return echec('deja-commence');
    if (defiExpire(ligne, options)) return echec('expire');
    const deckCreateur = trouverDeckPrete(ligne.deckCreateur);
    if (!deckCreateur) throw new Error(`Deck du créateur inconnu : ${ligne.deckCreateur}`);
    const graine = (options.tirerGraine ?? (() => randomInt(0, 2 ** 31)))();
    const etat = creerPartie({ j1: deckCreateur.cartes, j2: deck.cartes }, graine);
    const [maj] = await tx
      .update(duels)
      .set({
        statut: 'en-cours',
        version: ligne.version + 1,
        adversaireId: joueurId,
        deckAdversaire: deck.id,
        etat,
        majLe: new Date(),
      })
      .where(eq(duels.id, id))
      .returning();
    if (!maj) throw new Error('Mise à jour du duel impossible.');
    return { ok: true, valeur: maj } as const;
  });
  if (!resultat.ok) return resultat;
  return { ok: true, valeur: await visible(base, resultat.valeur, joueurId, 0) };
}

/**
 * Joue une action du joueur actif. `versionAttendue` (If-Match) refuse l'action si le duel a changé depuis ce que
 * le joueur a vu. La ligne est verrouillée : deux actions simultanées s'appliquent l'une après l'autre.
 */
export async function jouerDuel(
  base: Base,
  id: string,
  joueurId: string,
  action: Action,
  versionAttendue?: number,
): Promise<ResultatDuel<DuelVisible>> {
  const resultat = await base.transaction(async (tx) => {
    const [ligne] = await tx.select().from(duels).where(eq(duels.id, id)).for('update');
    const camp = ligne ? campDe(ligne, joueurId) : null;
    if (!ligne || !camp) return echec('introuvable');
    if (versionAttendue !== undefined && versionAttendue !== ligne.version) {
      return echec('version-perimee');
    }
    if (!ligne.etat) return echec('pas-commence');
    if (!ligne.etat.issue && ligne.etat.actif !== camp) return echec('pas-ton-tour');
    const avant = ligne.etat.journal.length;
    const applique = appliquer(ligne.etat, action);
    if (!applique.ok) {
      return { ok: false, raison: 'action-refusee', erreur: applique.erreur } as const;
    }
    const [maj] = await tx
      .update(duels)
      .set({
        etat: applique.etat,
        statut: applique.etat.issue ? 'termine' : 'en-cours',
        version: ligne.version + 1,
        majLe: new Date(),
      })
      .where(eq(duels.id, id))
      .returning();
    if (!maj) throw new Error('Mise à jour du duel impossible.');
    return { ok: true, valeur: { ligne: maj, avant } } as const;
  });
  if (!resultat.ok) return resultat;
  const { ligne, avant } = resultat.valeur;
  return { ok: true, valeur: await visible(base, ligne, joueurId, avant) };
}

/** Annule un défi pas encore accepté : seul son créateur le peut (US-033). */
export async function annulerDuel(
  base: Base,
  id: string,
  joueurId: string,
): Promise<ResultatDuel<null>> {
  return base.transaction(async (tx) => {
    const [ligne] = await tx.select().from(duels).where(eq(duels.id, id)).for('update');
    if (!ligne || ligne.createurId !== joueurId) return echec('introuvable');
    if (ligne.statut !== 'attente') return echec('deja-commence');
    await tx.delete(duels).where(eq(duels.id, id));
    return { ok: true, valeur: null } as const;
  });
}
