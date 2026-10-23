import { describe, expect, it } from 'vitest';
import { FAMILLES } from '../carte.ts';
import { trouverCarte } from '../set-1.ts';
import { type Fiche, problemesFiche } from './fiche.ts';
import { ficheDe, FICHES_PAR_FAMILLE } from './index.ts';

const FICHE: Fiche = {
  definition: 'Une définition.',
  usage: 'Un usage.',
  exemple: 'Un exemple.',
  aRetenir: 'Un piège.',
  liens: [{ titre: 'Un lien', url: 'https://fr.wikipedia.org/wiki/Exemple', langue: 'fr' }],
};

const toutesLesFiches = Object.entries(FICHES_PAR_FAMILLE).flatMap(([famille, fiches]) =>
  Object.entries(fiches).map(([numero, fiche]) => ({ famille, numero: Number(numero), fiche })),
);

describe('fiches du set 1', () => {
  it('rattache chaque fiche à une carte existante, rangée dans le fichier de sa famille', () => {
    for (const { famille, numero } of toutesLesFiches)
      expect(trouverCarte(numero)?.famille, `fiche n° ${numero}`).toBe(famille);
  });

  it('respecte le format de fiche : champs remplis, longueurs, de 1 à 3 liens https', () => {
    for (const { numero, fiche } of toutesLesFiches)
      expect(problemesFiche(fiche), `fiche n° ${numero}`).toEqual([]);
  });

  it('a au moins une fiche pilote par famille (US-073)', () => {
    for (const famille of FAMILLES)
      expect(Object.keys(FICHES_PAR_FAMILLE[famille]).length, famille).toBeGreaterThan(0);
  });

  it('trouve la fiche d’une carte par son numéro', () => {
    expect(ficheDe(1)?.liens[0]?.url).toBe('https://fr.wikipedia.org/wiki/File_Transfer_Protocol');
    expect(ficheDe(0)).toBeUndefined();
  });
});

describe('problemesFiche', () => {
  it('accepte une fiche complète', () => {
    expect(problemesFiche(FICHE)).toEqual([]);
  });

  it('signale un champ vide ou trop long, et une fiche trop longue', () => {
    expect(problemesFiche({ ...FICHE, definition: '  ', chezElis: '' })).toEqual([
      'definition : vide',
      'chezElis : vide',
    ]);
    expect(problemesFiche({ ...FICHE, usage: 'x'.repeat(361) })).toEqual([
      'usage : 361 caractères (au plus 360)',
    ]);
    expect(problemesFiche({ ...FICHE, chezElis: 'x'.repeat(241) })).toEqual([
      'chezElis : 241 caractères (au plus 240)',
    ]);
  });

  it('signale une fiche dont le total dépasse une minute de lecture', () => {
    const presque = (n: number) => 'x'.repeat(n);
    expect(
      problemesFiche({
        ...FICHE,
        definition: presque(220),
        usage: presque(360),
        exemple: presque(360),
        aRetenir: presque(320),
        chezElis: presque(100),
      }),
    ).toEqual(['fiche : 1360 caractères (au plus 1300)']);
  });

  it('exige de 1 à 3 liens https distincts, titrés, en français ou en anglais', () => {
    const lien = FICHE.liens[0]!;
    expect(problemesFiche({ ...FICHE, liens: [] })).toEqual(['liens : 0 (de 1 à 3)']);
    expect(problemesFiche({ ...FICHE, liens: [lien, lien] })).toEqual([
      'liens : adresse en double',
    ]);
    expect(
      problemesFiche({
        ...FICHE,
        liens: [
          { titre: ' ', url: 'http://example.com/', langue: 'fr' },
          { titre: 'Relatif', url: '/wiki/Exemple', langue: 'de' as 'fr' },
        ],
      }),
    ).toEqual([
      'lien http://example.com/ : titre vide',
      'lien http://example.com/ : adresse non https',
      'lien /wiki/Exemple : langue « de » inconnue',
      'lien /wiki/Exemple : adresse invalide',
    ]);
  });
});
