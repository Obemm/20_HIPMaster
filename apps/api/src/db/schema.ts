import { pgEnum, pgTable, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { RARETES } from '@hipmaster/domain';

export const rarete = pgEnum('rarete', RARETES);

/** Catalogue des cartes existantes (provisoire : à retirer avec la collection, US-023 et ADR 0011). */
export const cartes = pgTable('cartes', {
  id: uuid().primaryKey().defaultRandom(),
  nom: text().notNull(),
  rarete: rarete().notNull(),
  attaque: integer().notNull(),
  defense: integer().notNull(),
  creeLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Comptes invités (US-022, ADR 0017) : un pseudo, et l'empreinte du code de récupération. */
export const joueurs = pgTable('joueurs', {
  id: uuid().primaryKey().defaultRandom(),
  pseudo: text().notNull(),
  /** Empreinte SHA-256 du code de récupération : le code lui-même n'est jamais stocké. */
  empreinteCode: text().notNull().unique(),
  creeLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Sessions ouvertes (une par appareil) : l'empreinte SHA-256 du jeton, jamais le jeton. */
export const sessions = pgTable('sessions', {
  empreinteJeton: text().primaryKey(),
  joueurId: uuid()
    .notNull()
    .references(() => joueurs.id, { onDelete: 'cascade' }),
  creeLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
