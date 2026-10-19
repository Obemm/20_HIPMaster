import type { EtatPartie } from '@hipmaster/domain';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

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

/**
 * Récompenses de victoire (US-025, US-038) : une ligne par partie contre le bot ou par duel gagné (`partieId` porte
 * l'un ou l'autre identifiant), ce qui garantit une seule récompense par partie.
 * `booster` est faux quand le plafond quotidien était atteint.
 */
export const recompenses = pgTable('recompenses', {
  partieId: uuid().primaryKey(),
  joueurId: uuid()
    .notNull()
    .references(() => joueurs.id, { onDelete: 'cascade' }),
  booster: boolean().notNull(),
  /** Sans booster : pourquoi (plafond quotidien, ou adversaire déjà affronté le jour même, US-038). */
  motif: text({ enum: ['plafond', 'adversaire-deja-affronte'] }),
  accordeeLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * Duels entre joueurs (US-032, ADR 0020) : le créateur joue le camp j1, l'adversaire qui rejoint le camp j2 ; le
 * tirage du moteur désigne qui commence. `version` change à chaque action et à chaque changement de statut.
 */
export const duels = pgTable('duels', {
  id: uuid().primaryKey().defaultRandom(),
  statut: text({ enum: ['attente', 'en-cours', 'termine'] })
    .notNull()
    .default('attente'),
  version: integer().notNull().default(0),
  createurId: uuid()
    .notNull()
    .references(() => joueurs.id, { onDelete: 'cascade' }),
  deckCreateur: text().notNull(),
  /** Duel ouvert à tous (adversaire au hasard, US-037) ; sinon défi privé, rejoint par son lien (US-033). */
  ouvert: boolean().notNull().default(false),
  adversaireId: uuid().references(() => joueurs.id, { onDelete: 'cascade' }),
  deckAdversaire: text(),
  /** État complet du moteur, jamais renvoyé tel quel (seulement la vue de chaque joueur). */
  etat: jsonb().$type<EtatPartie>(),
  creeLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
  majLe: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
