import {
  DECKS_MAX,
  EXEMPLAIRES_MAX,
  EXEMPLAIRES_MAX_LEGENDAIRE,
  libererPlaces,
  problemesDeck,
  type ProblemeDeck,
  TAILLE_DECK,
} from '@hipmaster/domain';
import { and, asc, count, eq, sql } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { collection, decks, joueurs } from '../db/schema.ts';

// Decks des joueurs (US-083, ADR 0048). Contrat : apps/api/openapi/mes-decks.yaml.

/** Les règles du deck, rappelées par l'écran de construction ; le serveur reste seul juge. */
export const REGLES_DECK = {
  taille: TAILLE_DECK,
  exemplairesMax: EXEMPLAIRES_MAX,
  exemplairesMaxLegendaire: EXEMPLAIRES_MAX_LEGENDAIRE,
  decksMax: DECKS_MAX,
} as const;

/** Un deck tel que le joueur le voit : sa composition effective, sans les cartes disparues (ADR 0048). */
export interface DeckJoueur {
  id: string;
  nom: string;
  cartes: number[];
  /** 20 cartes qui respectent les règles et la collection : le deck sert à jouer. */
  complet: boolean;
  /** Places libérées par des cartes disparues depuis le dernier enregistrement. */
  liberees: number;
  majLe: Date;
}

export interface CompositionDeck {
  nom: string;
  cartes: readonly number[];
}

export type ResultatDeck<T> =
  | { ok: true; valeur: T }
  | { ok: false; raison: 'plafond' | 'introuvable' }
  | { ok: false; raison: 'invalide'; problemes: ProblemeDeck[] };

type LigneDeck = typeof decks.$inferSelect;
type Lecteur = Pick<Base, 'select'>;

/** Les exemplaires possédés par un joueur, par numéro de carte. */
export async function exemplairesPossedes(
  base: Lecteur,
  joueurId: string,
): Promise<Map<number, number>> {
  const lignes = await base
    .select({ numero: collection.numero, exemplaires: collection.exemplaires })
    .from(collection)
    .where(eq(collection.joueurId, joueurId));
  return new Map(lignes.map((l) => [l.numero, l.exemplaires]));
}

/** Le deck effectif : la composition enregistrée, confrontée à la collection et au catalogue. */
export function deckVisible(ligne: LigneDeck, possedes: ReadonlyMap<number, number>): DeckJoueur {
  const { cartes, liberees } = libererPlaces(ligne.cartes, possedes);
  return {
    id: ligne.id,
    nom: ligne.nom,
    cartes,
    complet: problemesDeck(cartes, possedes).length === 0,
    liberees,
    majLe: ligne.majLe,
  };
}

/** Mes decks, du plus ancien au plus récent. */
export async function lireDecks(base: Base, joueurId: string): Promise<DeckJoueur[]> {
  const [lignes, possedes] = await Promise.all([
    base
      .select()
      .from(decks)
      .where(eq(decks.joueurId, joueurId))
      .orderBy(asc(decks.creeLe), asc(decks.id)),
    exemplairesPossedes(base, joueurId),
  ]);
  return lignes.map((ligne) => deckVisible(ligne, possedes));
}

/** Un de mes decks ; `null` s'il n'existe pas ou appartient à un autre joueur. */
export async function lireDeck(
  base: Lecteur,
  joueurId: string,
  id: string,
): Promise<DeckJoueur | null> {
  const [ligne] = await base
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.joueurId, joueurId)));
  return ligne ? deckVisible(ligne, await exemplairesPossedes(base, joueurId)) : null;
}

/** Les problèmes qui empêchent d'enregistrer un deck : un brouillon de moins de 20 cartes passe (ADR 0048). */
const problemesEnregistrement = (
  cartes: readonly number[],
  possedes: ReadonlyMap<number, number>,
) => problemesDeck(cartes, possedes, { incompletPermis: true });

/** Enregistre un nouveau deck : 5 au plus, sous le verrou de la ligne du joueur (deux créations simultanées). */
export function creerDeck(
  base: Base,
  joueurId: string,
  { nom, cartes }: CompositionDeck,
): Promise<ResultatDeck<DeckJoueur>> {
  return base.transaction(async (tx) => {
    await tx.select({ id: joueurs.id }).from(joueurs).where(eq(joueurs.id, joueurId)).for('update');
    const [compte] = await tx
      .select({ n: count() })
      .from(decks)
      .where(eq(decks.joueurId, joueurId));
    if ((compte?.n ?? 0) >= DECKS_MAX) return { ok: false, raison: 'plafond' } as const;
    const possedes = await exemplairesPossedes(tx, joueurId);
    const problemes = problemesEnregistrement(cartes, possedes);
    if (problemes.length > 0) return { ok: false, raison: 'invalide', problemes } as const;
    const [ligne] = await tx
      .insert(decks)
      .values({ joueurId, nom, cartes: [...cartes] })
      .returning();
    if (!ligne) throw new Error('Deck non enregistré.');
    return { ok: true, valeur: deckVisible(ligne, possedes) } as const;
  });
}

/** Remplace le nom et la composition d'un de mes decks. */
export async function modifierDeck(
  base: Base,
  joueurId: string,
  id: string,
  { nom, cartes }: CompositionDeck,
): Promise<ResultatDeck<DeckJoueur>> {
  const possedes = await exemplairesPossedes(base, joueurId);
  const problemes = problemesEnregistrement(cartes, possedes);
  const [existe] = await base
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.joueurId, joueurId)));
  if (!existe) return { ok: false, raison: 'introuvable' };
  if (problemes.length > 0) return { ok: false, raison: 'invalide', problemes };
  const [ligne] = await base
    .update(decks)
    .set({ nom, cartes: [...cartes], majLe: sql`now()` })
    .where(and(eq(decks.id, id), eq(decks.joueurId, joueurId)))
    .returning();
  return ligne
    ? { ok: true, valeur: deckVisible(ligne, possedes) }
    : { ok: false, raison: 'introuvable' };
}

/** Supprime un de mes decks ; faux s'il n'existait pas. */
export async function supprimerDeck(base: Base, joueurId: string, id: string): Promise<boolean> {
  const supprimes = await base
    .delete(decks)
    .where(and(eq(decks.id, id), eq(decks.joueurId, joueurId)))
    .returning({ id: decks.id });
  return supprimes.length > 0;
}
