import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Comptes invités (US-022, ADR 0017) : un pseudo, et l'empreinte du code de récupération. */
export const joueurs = pgTable('joueurs', {
  id: uuid().primaryKey().defaultRandom(),
  pseudo: text().notNull(),
  /** Empreinte SHA-256 du code de récupération : le code lui-même n'est jamais stocké. */
  empreinteCode: text().notNull().unique(),
  creeLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
  /** Boosters en stock (US-023, ADR 0019) : 5 offerts à la création du compte. */
  boosters: integer().notNull().default(5),
  /** Instant d'où court la prochaine recharge gratuite ; le stock se recalcule à la lecture. */
  rechargeDepuis: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Sessions ouvertes (une par appareil) : l'empreinte SHA-256 du jeton, jamais le jeton. */
export const sessions = pgTable('sessions', {
  empreinteJeton: text().primaryKey(),
  joueurId: uuid()
    .notNull()
    .references(() => joueurs.id, { onDelete: 'cascade' }),
  creeLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Collection d'un joueur (US-023) : les cartes, désignées par leur numéro dans le catalogue (ADR 0011). */
export const collection = pgTable(
  'collection',
  {
    joueurId: uuid()
      .notNull()
      .references(() => joueurs.id, { onDelete: 'cascade' }),
    numero: integer().notNull(),
    exemplaires: integer().notNull(),
    obtenueLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.joueurId, table.numero] })],
);
