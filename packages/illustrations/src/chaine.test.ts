import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { produireIllustrations, type Chemins } from './chaine.ts';
import { POIDS_MAX } from './declinaisons.ts';

/** Un original de synthèse, assez riche pour que la compression ait du travail. */
async function original(largeur: number): Promise<Buffer> {
  const hauteur = Math.round((largeur * 3) / 4);
  const cercles = Array.from({ length: 40 }, (_, i) => {
    const x = (i * 97) % largeur;
    const y = (i * 53) % hauteur;
    return `<circle cx="${x}" cy="${y}" r="${30 + (i % 7) * 12}" fill="hsl(${i * 37} 70% 55%)" opacity="0.7"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}">
    <defs><linearGradient id="f"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#f)"/>${cercles}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const entree = (numero: number) => ({
  numero,
  alt: 'Un serveur de fichiers poussiéreux sous une lampe de bureau',
  provenance: { outil: 'test', date: '2026-10-18' },
});

let dossier: string;
let chemins: Chemins;
const cartes = new Set([1, 2, 3]);

beforeEach(async () => {
  dossier = await mkdtemp(join(tmpdir(), 'hip-illustrations-'));
  chemins = {
    metadonnees: join(dossier, 'set-1.json'),
    sources: dossier,
    sortie: join(dossier, 'sortie'),
    manifeste: join(dossier, 'illustrations.generated.ts'),
  };
});
afterEach(() => rm(dossier, { recursive: true, force: true }));

const ecrireMetadonnees = (illustrations: unknown[]) =>
  writeFile(chemins.metadonnees, JSON.stringify({ illustrations }));

describe('produireIllustrations', () => {
  it('décline chaque original en AVIF et WebP, en 320 et 640 px, en 4:3 et sous 100 Ko', async () => {
    await writeFile(join(dossier, '2.png'), await original(1365));
    await ecrireMetadonnees([entree(2)]);

    const { erreurs, fichiers } = await produireIllustrations(chemins, cartes);

    expect(erreurs).toEqual([]);
    expect(fichiers).toEqual(['2-320.avif', '2-320.webp', '2-640.avif', '2-640.webp']);
    for (const nom of fichiers) {
      const donnees = await readFile(join(chemins.sortie, nom));
      const { width, height } = await sharp(donnees).metadata();
      expect(width / height).toBeCloseTo(4 / 3);
      expect(donnees.length).toBeLessThan(POIDS_MAX);
    }
  });

  it('écrit le manifeste du front, trié par numéro de carte', async () => {
    await writeFile(join(dossier, '3.png'), await original(800));
    await writeFile(join(dossier, '1.png'), await original(800));
    await ecrireMetadonnees([entree(3), entree(1)]);

    await produireIllustrations(chemins, cartes);

    const manifeste = await readFile(chemins.manifeste, 'utf8');
    expect(manifeste).toContain('ILLUSTRATIONS_SET_1');
    expect(manifeste.indexOf('1:')).toBeLessThan(manifeste.indexOf('3:'));
    expect(manifeste).toContain("'Un serveur de fichiers poussiéreux sous une lampe de bureau'");
  });

  it('retire les images d’une carte qui n’est plus décrite', async () => {
    await writeFile(join(dossier, '1.png'), await original(800));
    await writeFile(join(dossier, '2.png'), await original(800));
    await ecrireMetadonnees([entree(1), entree(2)]);
    await produireIllustrations(chemins, cartes);

    await ecrireMetadonnees([entree(2)]);
    await produireIllustrations(chemins, cartes);

    expect((await readdir(chemins.sortie)).sort()).toEqual([
      '2-320.avif',
      '2-320.webp',
      '2-640.avif',
      '2-640.webp',
    ]);
  });

  it('refuse un original absent ou trop petit, et n’écrit alors rien', async () => {
    await writeFile(join(dossier, '1.png'), await original(500));
    await ecrireMetadonnees([entree(1), entree(2)]);

    const { erreurs, fichiers } = await produireIllustrations(chemins, cartes);

    expect(erreurs).toEqual([
      'carte 1 : original trop petit, largeur 500 px, il en faut au moins 640',
      expect.stringMatching(/^carte 2 : original introuvable/),
    ]);
    expect(fichiers).toEqual([]);
    await expect(readFile(chemins.manifeste)).rejects.toThrow();
  });

  it('refuse une carte inconnue, un doublon et un texte alternatif manquant', async () => {
    await ecrireMetadonnees([entree(9), entree(1), entree(1), { ...entree(2), alt: '' }]);

    const { erreurs } = await produireIllustrations(chemins, cartes);

    expect(erreurs).toEqual([
      'illustrations.3.alt : texte alternatif trop court (10 caractères au moins)',
    ]);

    await ecrireMetadonnees([entree(9), entree(1), entree(1)]);
    expect((await produireIllustrations(chemins, cartes)).erreurs).toEqual([
      'carte 9 : aucune carte ne porte ce numéro',
      'carte 1 : décrite plusieurs fois',
    ]);
  });
});
