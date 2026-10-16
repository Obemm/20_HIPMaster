import { pgEnum, pgTable, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { RARETES } from '@hipmaster/domain';

export const rarete = pgEnum('rarete', RARETES);

/** Catalogue des cartes existantes (provisoire : le modèle de carte sera défini dans EPIC-01). */
export const cartes = pgTable('cartes', {
  id: uuid().primaryKey().defaultRandom(),
  nom: text().notNull(),
  rarete: rarete().notNull(),
  attaque: integer().notNull(),
  defense: integer().notNull(),
  creeLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
