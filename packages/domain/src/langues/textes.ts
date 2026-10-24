/**
 * Les textes du jeu dans d'autres langues que le français (US-081, ADR 0043). Le français, écrit dans le catalogue
 * lui-même (`set-1.ts`, `capacites.ts`, `fiches/`, `combat/niveaux.ts`, `combat/decks.ts`), fait foi : chaque autre
 * langue en est une traduction, rangée par numéro de carte ou par identifiant, et le français sert de repli.
 */
import type { IdCapacite } from '../capacites.ts';
import type { Fiche } from '../fiches/fiche.ts';

/** Langues du jeu : le français, langue de référence, puis ses traductions. */
export const LANGUES = ['fr', 'en'] as const;
export type Langue = (typeof LANGUES)[number];
export const LANGUE_REFERENCE: Langue = 'fr';

/** Les textes d'une carte : son nom, son effet propre s'il en a un, et son « En vrai ». */
export interface TexteCarte {
  nom: string;
  effet?: string;
  enVrai: string;
}

/** Nom et description d'une capacité. */
export interface TexteCapacite {
  nom: string;
  description: string;
}

/** Nom et description d'un niveau de bot ou d'un deck prêté. */
export interface TexteNomme {
  nom: string;
  description: string;
}

/** Tous les textes du catalogue dans une langue autre que le français. */
export interface TextesLangue {
  cartes: Readonly<Record<number, TexteCarte>>;
  capacites: Readonly<Record<IdCapacite, TexteCapacite>>;
  fiches: Readonly<Record<number, Fiche>>;
  niveaux: Readonly<Record<string, TexteNomme>>;
  decks: Readonly<Record<string, TexteNomme>>;
}
