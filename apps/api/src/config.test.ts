import { describe, expect, it } from 'vitest';
import { ErreurConfig, lireConfig } from './config.ts';

const NEON =
  'postgresql://hipmaster:secret@ep-calme-1234.eu-central-1.aws.neon.tech/hipmaster?sslmode=require';

describe('configuration de l’API (US-046)', () => {
  it('en développement, écoute 127.0.0.1:3000 et prend PGlite, avec un petit pool par défaut', () => {
    const config = lireConfig({});
    expect(config).toMatchObject({
      production: false,
      hote: '127.0.0.1',
      port: 3000,
      databaseUrl: null,
      pool: { max: 5, inactiviteSecondes: 30, delaiConnexionSecondes: 10 },
      niveauJournal: 'info',
      projetGcp: null,
    });
    expect(config.baseLocale).toMatch(/\.donnees[\\/]pglite$/);
  });

  it('avec PORT (Cloud Run), écoute toutes les interfaces sur ce port', () => {
    expect(lireConfig({ PORT: '8080' })).toMatchObject({ hote: '0.0.0.0', port: 8080 });
  });

  it('API_HOST et API_PORT (.env de développement) priment sur PORT', () => {
    const config = lireConfig({ PORT: '8080', API_HOST: '127.0.0.1', API_PORT: '3001' });
    expect(config).toMatchObject({ hote: '127.0.0.1', port: 3001 });
  });

  it('règle le pool, le niveau de journal et le projet Google Cloud par variables', () => {
    const config = lireConfig({
      BASE_CONNEXIONS_MAX: '3',
      BASE_INACTIVITE_SECONDES: '15',
      BASE_DELAI_CONNEXION_SECONDES: '5',
      LOG_LEVEL: 'warn',
      GOOGLE_CLOUD_PROJECT: 'hipmaster',
    });
    expect(config).toMatchObject({
      pool: { max: 3, inactiviteSecondes: 15, delaiConnexionSecondes: 5 },
      niveauJournal: 'warn',
      projetGcp: 'hipmaster',
    });
  });

  it('refuse de démarrer en production sans DATABASE_URL, en le disant clairement', () => {
    expect(() => lireConfig({ NODE_ENV: 'production' })).toThrow(ErreurConfig);
    expect(() => lireConfig({ NODE_ENV: 'production' })).toThrow(
      /obligatoire en production[\s\S]*DATABASE_URL/,
    );
  });

  it('démarre en production avec l’URL de la base', () => {
    const config = lireConfig({ NODE_ENV: 'production', PORT: '8080', DATABASE_URL: NEON });
    expect(config).toMatchObject({ production: true, hote: '0.0.0.0', databaseUrl: NEON });
  });

  it('refuse le point d’accès mutualisé de Neon (PgBouncer en mode transaction)', () => {
    const mutualise = NEON.replace('ep-calme-1234.', 'ep-calme-1234-pooler.');
    expect(() => lireConfig({ DATABASE_URL: mutualise })).toThrow(/point d’accès direct/);
  });

  it('refuse un niveau de journal inconnu', () => {
    expect(() => lireConfig({ LOG_LEVEL: 'bavard' })).toThrow(/LOG_LEVEL/);
  });
});
