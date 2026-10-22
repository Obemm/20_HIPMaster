import { describe, expect, it } from 'vitest';
import { CLE_CODES_DEVELOPPEMENT } from './comptes/comptes.ts';
import { ErreurConfig, lireConfig, lireConfigApi, lireConfigCle } from './config.ts';

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

describe('configuration des protections de l’API (US-047, ADR 0025)', () => {
  const CLE = 'k'.repeat(43);
  const PRODUCTION = {
    NODE_ENV: 'production',
    PORT: '8080',
    DATABASE_URL: NEON,
    CLE_CODES_RECUPERATION: CLE,
    PROXYS_DE_CONFIANCE: '2',
  };

  it('en développement : clé publique, aucun relais de confiance, limites de débit désactivées', () => {
    expect(lireConfigApi({})).toMatchObject({
      cleCodes: CLE_CODES_DEVELOPPEMENT,
      proxysDeConfiance: 0,
      limitesDebit: null,
    });
  });

  it('en production : la clé et les relais fournis, les limites de débit actives (facteur 1)', () => {
    expect(lireConfigApi(PRODUCTION)).toMatchObject({
      production: true,
      cleCodes: CLE,
      proxysDeConfiance: 2,
      limitesDebit: 1,
    });
  });

  it('refuse de démarrer en production sans clé des codes ni nombre de relais, en le disant', () => {
    const sans = { NODE_ENV: 'production', DATABASE_URL: NEON };
    expect(() => lireConfigApi(sans)).toThrow(ErreurConfig);
    expect(() => lireConfigApi(sans)).toThrow(
      /obligatoire en production[\s\S]*CLE_CODES_RECUPERATION/,
    );
    expect(() => lireConfigApi(sans)).toThrow(
      /obligatoire en production[\s\S]*PROXYS_DE_CONFIANCE/,
    );
    expect(() => lireConfigApi({ ...PRODUCTION, CLE_CODES_RECUPERATION: 'trop-courte' })).toThrow(
      /CLE_CODES_RECUPERATION/,
    );
  });

  it('la commande de migration n’exige ni la clé des codes ni les relais', () => {
    expect(lireConfig({ NODE_ENV: 'production', DATABASE_URL: NEON })).toMatchObject({
      production: true,
      databaseUrl: NEON,
    });
  });

  it('LIMITES_DEBIT multiplie les limites ou les désactive, partout', () => {
    expect(lireConfigApi({ ...PRODUCTION, LIMITES_DEBIT: '2.5' }).limitesDebit).toBe(2.5);
    expect(lireConfigApi({ ...PRODUCTION, LIMITES_DEBIT: 'desactivees' }).limitesDebit).toBeNull();
    expect(lireConfigApi({ LIMITES_DEBIT: '1' }).limitesDebit).toBe(1);
    expect(() => lireConfigApi({ LIMITES_DEBIT: 'beaucoup' })).toThrow(/LIMITES_DEBIT/);
    expect(() => lireConfigApi({ LIMITES_DEBIT: '0' })).toThrow(/LIMITES_DEBIT/);
  });

  it('refuse un nombre de relais négatif ou déraisonnable', () => {
    expect(() => lireConfigApi({ PROXYS_DE_CONFIANCE: '-1' })).toThrow(/PROXYS_DE_CONFIANCE/);
    expect(() => lireConfigApi({ PROXYS_DE_CONFIANCE: '50' })).toThrow(/PROXYS_DE_CONFIANCE/);
  });
});

describe('configuration de l’inscription sur invitation (US-048, ADR 0027)', () => {
  const PRODUCTION = {
    NODE_ENV: 'production',
    DATABASE_URL: NEON,
    CLE_CODES_RECUPERATION: 'k'.repeat(43),
    PROXYS_DE_CONFIANCE: '2',
  };

  it('exige une invitation par défaut en production seulement', () => {
    expect(lireConfigApi(PRODUCTION).inscriptionSurInvitation).toBe(true);
    expect(lireConfigApi({}).inscriptionSurInvitation).toBe(false);
  });

  it('INSCRIPTION_SUR_INVITATION se règle par oui ou non, partout', () => {
    expect(
      lireConfigApi({ ...PRODUCTION, INSCRIPTION_SUR_INVITATION: 'non' }).inscriptionSurInvitation,
    ).toBe(false);
    expect(lireConfigApi({ INSCRIPTION_SUR_INVITATION: 'oui' }).inscriptionSurInvitation).toBe(
      true,
    );
    expect(() => lireConfigApi({ INSCRIPTION_SUR_INVITATION: 'peut-être' })).toThrow(
      /INSCRIPTION_SUR_INVITATION/,
    );
  });

  it('la commande des invitations exige la clé des codes en production, pas les relais', () => {
    const sansRelais = { ...PRODUCTION, PROXYS_DE_CONFIANCE: undefined };
    expect(lireConfigCle(sansRelais)).toMatchObject({ cleCodes: 'k'.repeat(43) });
    expect(() => lireConfigCle({ NODE_ENV: 'production', DATABASE_URL: NEON })).toThrow(
      /obligatoire en production[\s\S]*CLE_CODES_RECUPERATION/,
    );
    expect(lireConfigCle({})).toMatchObject({ cleCodes: CLE_CODES_DEVELOPPEMENT });
  });
});
