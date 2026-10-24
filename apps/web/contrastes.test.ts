import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Contrastes des jetons de couleur (US-061, ADR 0037) : chaque paire texte / fond de la charte atteint le niveau AA
 * (4,5:1 pour le texte, 3:1 pour les grands titres et les contours), dans les deux thèmes. L'audit axe des parcours
 * e2e ne peut pas mesurer le texte posé sur le décor du fond (halos en dégradé) : ce test le couvre, au pire endroit.
 */

const css = readFileSync(new URL('src/styles.css', import.meta.url), 'utf8');

type Rgba = [number, number, number, number];

/** Le bloc `{ … }` qui suit la n-ième occurrence de `selecteur` après `depuis`. */
function bloc(selecteur: string, depuis = 0): string {
  const debut = css.indexOf(`${selecteur} {`, depuis);
  if (debut < 0) throw new Error(`Bloc introuvable : ${selecteur}`);
  let profondeur = 0;
  for (let i = css.indexOf('{', debut); i < css.length; i++) {
    if (css[i] === '{') profondeur++;
    if (css[i] === '}' && --profondeur === 0) return css.slice(debut, i);
  }
  throw new Error(`Bloc non fermé : ${selecteur}`);
}

function couleur(valeur: string): Rgba {
  const hexa = /^#([0-9a-f]{6})$/i.exec(valeur);
  if (hexa?.[1]) {
    const n = Number.parseInt(hexa[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(valeur);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), Number(rgb[4] ?? 1)];
  throw new Error(`Couleur illisible : ${valeur}`);
}

/** Les propriétés `--hip-*` (ou toute propriété nommée) d'un bloc dont la valeur est une couleur. */
function jetons(texte: string): Record<string, Rgba> {
  const resultat: Record<string, Rgba> = {};
  for (const [, nom, valeur] of texte.matchAll(
    /(--hip-[a-z0-9-]+|background(?:-color)?|color):\s*(#[0-9a-f]{6}|rgb\([^)]*\));/gi,
  )) {
    if (nom && valeur) {
      resultat[nom.replace(/^--hip-/, '').replace('background-color', 'background')] =
        couleur(valeur);
    }
  }
  return resultat;
}

/** Une couleur semi-transparente posée sur une couleur opaque. */
function poser(dessus: Rgba, dessous: Rgba): Rgba {
  const a = dessus[3];
  return [0, 1, 2].map((i) => dessus[i]! * a + dessous[i]! * (1 - a)).concat(1) as Rgba;
}

function luminance([r, v, b]: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(v) + 0.0722 * lin(b);
}

function contraste(a: Rgba, b: Rgba): number {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (clair + 0.05) / (sombre + 0.05);
}

const debutSombre = css.indexOf('@media (prefers-color-scheme: dark)');
const clair = jetons(bloc(':root'));
const sombre = { ...clair, ...jetons(bloc(':root', debutSombre)) };
const coquille = { ...sombre, ...jetons(bloc('.coquille')) };
/** Les cadres de rareté ont leur propre variante sombre, plus bas dans la feuille. */
const debutCadresSombres = css.indexOf(
  '@media (prefers-color-scheme: dark)',
  css.indexOf('.cadre-commune {'),
);
const THEMES = { clair, sombre } as const;

/** [texte, fond, contraste minimal] */
const PAIRES: [string, string, number][] = [
  ['texte', 'fond', 4.5],
  ['texte', 'surface', 4.5],
  ['texte', 'surface-haute', 4.5],
  ['texte-doux', 'fond', 4.5],
  ['texte-doux', 'surface', 4.5],
  ['texte-doux', 'surface-haute', 4.5],
  ['accent', 'fond', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'surface-haute', 4.5],
  ['sur-accent', 'accent', 4.5],
  ['sur-action', 'action', 4.5],
  ['sur-action', 'action-survol', 4.5],
  ['alerte', 'fond', 4.5],
  ['alerte', 'surface', 4.5],
  ['succes', 'surface', 4.5],
  // Le doré ne sert qu'aux grands titres (« HIP » de l'accueil) : 3:1.
  ['or', 'fond', 3],
  // Contours des champs et anneau de focus : 3:1 (WCAG 1.4.11).
  ['bordure-forte', 'fond', 3],
  ['bordure-forte', 'surface', 3],
];

describe('contrastes de la charte', () => {
  for (const [nomTheme, theme] of Object.entries(THEMES)) {
    it.each(PAIRES)(`thème ${nomTheme} : %s sur %s, au moins %s:1`, (texte, fond, minimum) => {
      expect(contraste(theme[texte]!, theme[fond]!)).toBeGreaterThanOrEqual(minimum);
    });

    it(`thème ${nomTheme} : le texte reste lisible sur les halos du fond`, () => {
      for (const halo of ['halo-1', 'halo-2']) {
        const fond = poser(theme[halo]!, theme['fond']!);
        expect(contraste(theme['texte-doux']!, fond)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(theme['accent']!, fond)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it.each([
    ['texte', 4.5],
    ['texte-doux', 4.5],
    ['accent', 4.5],
    ['or', 4.5],
  ])('coquille de nuit : %s sur le fond, au moins %s:1', (texte, minimum) => {
    expect(contraste(coquille[texte]!, coquille['fond']!)).toBeGreaterThanOrEqual(minimum);
  });

  it('la pastille des onglets se lit (blanc sur rose)', () => {
    const pastille = jetons(bloc('.pastille'));
    expect(contraste(pastille['color']!, pastille['background']!)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['.statut-a-jouer', '.statut-victoire', '.statut-defaite'])(
    'la pastille d’état %s se lit (US-068)',
    (selecteur) => {
      const pastille = jetons(bloc(selecteur));
      expect(contraste(pastille['color']!, pastille['background']!)).toBeGreaterThanOrEqual(4.5);
    },
  );

  for (const rarete of ['commune', 'rare', 'epique', 'legendaire']) {
    it(`la carte ${rarete} se lit dans les deux thèmes`, () => {
      const carteClaire = jetons(bloc(`.cadre-${rarete}`));
      const carteSombre = jetons(bloc(`.cadre-${rarete}`, debutCadresSombres));
      for (const [theme, carte] of [
        [clair, carteClaire],
        [sombre, carteSombre],
      ] as const) {
        expect(contraste(theme['texte']!, carte['fond-carte']!)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(theme['texte-doux']!, carte['fond-carte']!)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
