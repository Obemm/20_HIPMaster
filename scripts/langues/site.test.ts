import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  balisesApercu,
  type Coquille,
  lireLangues,
  manifesteDe,
  pageAccueil,
  traduireIndex,
} from './site.ts';
import { comparerTraductions } from './traductions.ts';

const WEB = resolve(import.meta.dirname, '../../apps/web');
const lire = (chemin: string): string => readFileSync(join(WEB, chemin), 'utf8');

describe('les langues du site', () => {
  it('le français est la langue source, l’anglais sa traduction, chacune sous son préfixe', () => {
    expect(lireLangues(WEB)).toEqual([
      { code: 'fr', sousChemin: 'fr' },
      { code: 'en', sousChemin: 'en', traduction: 'src/locale/messages.en.json' },
    ]);
  });

  it('la coquille anglaise traduit chaque texte français d’index.html', () => {
    const coquille = JSON.parse(lire('src/locale/coquille.en.json')) as Coquille;
    const traduit = traduireIndex(lire('src/index.html'), coquille, 'en');
    for (const [francais] of coquille.index) expect(traduit).not.toContain(francais);
    expect(traduit).toContain('Loading HIPMaster…');
    expect(traduit).toContain('content="en_GB"');
  });

  it('arrête le build si un texte français de la coquille a disparu d’index.html', () => {
    const coquille: Coquille = {
      manifeste: { name: 'n', description: 'd' },
      index: [['Texte retouché', 'Edited text']],
    };
    expect(() => traduireIndex('<p>Autre texte</p>', coquille, 'en')).toThrow(
      /coquille\.en\.json : « Texte retouché »/,
    );
  });

  it('un manifeste par langue, pour une seule application installée qui s’ouvre dans la dernière langue', () => {
    const source = JSON.parse(lire('public/manifest.webmanifest')) as Record<string, unknown>;
    const anglais = manifesteDe(
      source,
      { code: 'en', sousChemin: 'en' },
      {
        manifeste: { name: 'HIPMaster — the integration card game', description: 'From FTP…' },
        index: [],
      },
    );
    expect(anglais).toMatchObject({
      name: 'HIPMaster — the integration card game',
      short_name: 'HIPMaster',
      lang: 'en',
      id: '/',
      scope: '/',
      start_url: '/en/',
      display: 'standalone',
    });
    expect(manifesteDe(source, { code: 'fr', sousChemin: 'fr' }, undefined)).toMatchObject({
      name: source['name'],
      lang: 'fr',
      start_url: '/fr/',
    });
  });

  it('la page d’accueil du site reprend l’aperçu des liens partagés de la version française', () => {
    const balises = balisesApercu(lire('src/index.html'));
    expect(balises.some((b) => b.includes('property="og:image"'))).toBe(true);
    expect(balises.some((b) => b.includes('name="description"'))).toBe(true);
    expect(balises.some((b) => b.includes('name="viewport"'))).toBe(false);
    const page = pageAccueil(lire('racine/index.html'), balises);
    expect(page).toContain('property="og:title"');
    expect(page).toContain('<script src="/langue.js"></script>');
  });
});

describe('comparerTraductions', () => {
  it('repère les traductions manquantes, orphelines et les textes modifiés', () => {
    expect(
      comparerTraductions(
        { a: 'Jouer', b: 'Duels', c: 'Compte' },
        { a: 'Jouer', b: 'Duel', d: 'x' },
      ),
    ).toEqual({ manquantes: ['c'], orphelines: ['d'], modifiees: ['b'] });
  });
});
