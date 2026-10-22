import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { describe, expect, it } from 'vitest';
import { migrerPostgres, urlPostgres } from './index.ts';

describe('URL de connexion PostgreSQL (ADR 0023)', () => {
  it('vérifie le certificat quand l’URL demande TLS (sslmode=require des URL de Neon)', () => {
    const neon =
      'postgresql://hipmaster:secret@ep-calme-1234.eu-central-1.aws.neon.tech/hipmaster?sslmode=require&channel_binding=require';
    expect(urlPostgres(neon)).toBe(
      'postgresql://hipmaster:secret@ep-calme-1234.eu-central-1.aws.neon.tech/hipmaster?sslmode=verify-full',
    );
  });

  it('laisse intacte une URL sans TLS (PostgreSQL local de docker-compose.yml)', () => {
    const locale = 'postgres://hipmaster:hipmaster@localhost:5433/hipmaster';
    expect(urlPostgres(locale)).toBe(locale);
  });
});

/** Nombre de migrations du dépôt, d'après le journal de drizzle-kit. */
const MIGRATIONS = (
  JSON.parse(
    readFileSync(new URL('../../drizzle/meta/_journal.json', import.meta.url), 'utf8'),
  ) as { entries: unknown[] }
).entries.length;

// Seulement contre un vrai PostgreSQL (DATABASE_URL), sur une base créée pour l'occasion.
describe.skipIf(!process.env.DATABASE_URL)('migrations sur PostgreSQL (ADR 0023)', () => {
  it('deux migrations simultanées s’attendent, et une migration relancée n’a aucun effet', async () => {
    const admin = postgres(process.env.DATABASE_URL ?? '', { max: 1, onnotice: () => undefined });
    const nom = `hipmaster_migrations_${process.pid}_${Date.now()}`;
    await admin.unsafe(`create database ${nom}`);
    const url = new URL(process.env.DATABASE_URL ?? '');
    url.pathname = `/${nom}`;
    try {
      const simultanees = await Promise.all([
        migrerPostgres(url.toString()),
        migrerPostgres(url.toString()),
      ]);
      expect(simultanees.map((b) => b.appliquees).sort((a, b) => a - b)).toEqual([0, MIGRATIONS]);
      expect(simultanees.map((b) => b.total)).toEqual([MIGRATIONS, MIGRATIONS]);
      expect(await migrerPostgres(url.toString())).toEqual({ appliquees: 0, total: MIGRATIONS });
    } finally {
      await admin.unsafe(`drop database if exists ${nom} with (force)`);
      await admin.end();
    }
  });
});
