import { SET_1, trouverCarte, type Carte } from '@hipmaster/domain';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { dessinerCarte, HAUTEUR, LARGEUR, texteAlternatif } from './dessin.ts';

const carte = (numero: number): Carte => {
  const trouvee = trouverCarte(numero);
  if (!trouvee) throw new Error(`carte ${numero} absente du set 1`);
  return trouvee;
};

describe('dessinerCarte', () => {
  it('dessine toujours la même image pour une même carte', () => {
    expect(dessinerCarte(carte(1))).toBe(dessinerCarte(carte(1)));
  });

  it('donne une image différente à chacune des 71 cartes, même famille, type et rareté', () => {
    const images = new Set(SET_1.map(dessinerCarte));
    expect(images.size).toBe(SET_1.length);
  });

  it('ne contient ni texte ni image externe', () => {
    for (const c of SET_1) {
      const svg = dessinerCarte(c);
      expect(svg, `carte ${c.numero}`).not.toMatch(/<text|<image|href=/);
    }
  });

  it('produit un SVG valide au format 4:3, que sharp sait rendre', async () => {
    const { width, height, format } = await sharp(Buffer.from(dessinerCarte(carte(39)))).metadata();
    expect(format).toBe('svg');
    expect(width / height).toBeCloseTo(LARGEUR / HAUTEUR);
  });

  it('marque la rareté : halo doré pour une légendaire, rien pour une commune', () => {
    expect(dessinerCarte(carte(1))).toContain('url(#halo-legendaire)');
    expect(dessinerCarte(carte(4))).not.toMatch(/fill="url\(#halo-/);
  });
});

describe('texteAlternatif', () => {
  it('décrit l’emblème, le type et la rareté, sans répéter le nom de la carte', () => {
    const ftp = carte(1);
    expect(texteAlternatif(ftp)).toBe(
      'Illustration provisoire : une pile de documents sur fond bleu nuit, avec un halo doré semé d’étincelles',
    );
    expect(texteAlternatif(ftp)).not.toContain(ftp.nom);
  });

  it('reste entre 10 et 200 caractères pour toutes les cartes', () => {
    for (const c of SET_1) {
      expect(texteAlternatif(c).length, `carte ${c.numero}`).toBeGreaterThanOrEqual(10);
      expect(texteAlternatif(c).length, `carte ${c.numero}`).toBeLessThanOrEqual(200);
    }
  });
});
