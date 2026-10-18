import type { Carte, Rarete } from '@hipmaster/domain';
import { DESCRIPTIONS_EMBLEME, DETAILS, PALETTES, SILHOUETTES } from './emblemes.ts';
import { creerHasard, entre } from './hasard.ts';

/** Surface de dessin en 4:3 (ADR 0015) ; le rendu PNG se fait à une taille supérieure. */
export const LARGEUR = 1200;
export const HAUTEUR = 900;
const CENTRE_X = LARGEUR / 2;
const CENTRE_Y = 420;
/** Agrandissement des emblèmes et de leurs motifs : l'image doit rester lisible à 170 px de large. */
const G = 1.4;
const FOND = '#0b1023';

const f = (n: number) => n.toFixed(1);

function etoiles(hasard: () => number): string {
  return Array.from({ length: 70 }, () => {
    const r = entre(hasard, 1, 3.2);
    return `<circle cx="${f(entre(hasard, 0, LARGEUR))}" cy="${f(entre(hasard, 0, HAUTEUR))}" r="${f(r)}" fill="#ffffff" opacity="${f(entre(hasard, 0.15, 0.7))}"/>`;
  }).join('');
}

/** Petite constellation propre à la carte : ce qui distingue deux cartes de même famille, type et rareté. */
function constellation(hasard: () => number, couleur: string): string {
  const cote = hasard() < 0.5 ? -1 : 1;
  const origineX = CENTRE_X + cote * entre(hasard, 430, 500);
  const origineY = entre(hasard, 110, 200);
  const points = Array.from({ length: 3 + Math.floor(hasard() * 4) }, () => [
    origineX + entre(hasard, -110, 110),
    origineY + entre(hasard, -90, 90),
  ]);
  const traits = points
    .slice(1)
    .map(([x, y], i) => {
      const [px, py] = points[i] ?? [x, y];
      return `<line x1="${f(px ?? 0)}" y1="${f(py ?? 0)}" x2="${f(x ?? 0)}" y2="${f(y ?? 0)}"/>`;
    })
    .join('');
  const noeuds = points
    .map(([x, y]) => `<circle cx="${f(x ?? 0)}" cy="${f(y ?? 0)}" r="7"/>`)
    .join('');
  return `<g stroke="${couleur}" stroke-width="3" fill="${couleur}" opacity="0.55">${traits}${noeuds}</g>`;
}

function etincelle(x: number, y: number, taille: number, couleur: string): string {
  const t = taille;
  return `<path d="M${f(x)} ${f(y - t)} Q${f(x)} ${f(y)} ${f(x + t)} ${f(y)} Q${f(x)} ${f(y)} ${f(x)} ${f(y + t)} Q${f(x)} ${f(y)} ${f(x - t)} ${f(y)} Q${f(x)} ${f(y)} ${f(x)} ${f(y - t)} Z" fill="${couleur}"/>`;
}

/** La rareté se lit à l'intensité : rien, un anneau, deux anneaux, puis un halo doré et des étincelles. */
function aura(rarete: Rarete, hasard: () => number): { derriere: string; devant: string } {
  const anneau = (rayon: number, couleur: string, opacite: number, epaisseur = 4) =>
    `<ellipse cx="${CENTRE_X}" cy="${CENTRE_Y}" rx="${rayon}" ry="${f(rayon * 0.92)}" fill="none" stroke="${couleur}" stroke-width="${epaisseur}" opacity="${opacite}"/>`;
  switch (rarete) {
    case 'commune':
      return { derriere: '', devant: '' };
    case 'rare':
      return { derriere: anneau(250 * G, '#38bdf8', 0.55), devant: '' };
    case 'epique':
      return {
        derriere: `<circle cx="${CENTRE_X}" cy="${CENTRE_Y}" r="${300 * G}" fill="url(#halo-epique)"/>${anneau(250 * G, '#a78bfa', 0.7, 6)}${anneau(285 * G, '#a78bfa', 0.35, 4)}`,
        devant: '',
      };
    case 'legendaire': {
      const etincelles = Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2 + entre(hasard, -0.2, 0.2);
        const rayon = entre(hasard, 230, 320) * G;
        return etincelle(
          CENTRE_X + Math.cos(angle) * rayon,
          CENTRE_Y + Math.sin(angle) * rayon * 0.85,
          entre(hasard, 10, 22),
          '#fde68a',
        );
      }).join('');
      return {
        derriere: `<circle cx="${CENTRE_X}" cy="${CENTRE_Y}" r="${340 * G}" fill="url(#halo-legendaire)"/>${anneau(255 * G, '#fbbf24', 0.8, 7)}`,
        devant: etincelles,
      };
    }
  }
}

/** Motif secondaire selon le type : satellites (composant), chevrons (évolution), cercle runique (sort), fissures (incident). */
function motifType(carte: Carte, hasard: () => number, couleur: string): string {
  switch (carte.type) {
    case 'composant': {
      const nombre = Math.min(Math.max(carte.cout, 1), 6);
      const depart = hasard() * Math.PI * 2;
      return Array.from({ length: nombre }, (_, i) => {
        const angle = depart + (i / nombre) * Math.PI * 2;
        return `<circle cx="${f(CENTRE_X + Math.cos(angle) * 205 * G)}" cy="${f(CENTRE_Y + Math.sin(angle) * 190 * G)}" r="15" fill="${couleur}" opacity="0.85"/>`;
      }).join('');
    }
    case 'evolution':
      return [0, 1, 2]
        .map(
          (i) =>
            `<path d="M${CENTRE_X - 60} ${CENTRE_Y + 360 - i * 40} L${CENTRE_X} ${CENTRE_Y + 320 - i * 40} L${CENTRE_X + 60} ${CENTRE_Y + 360 - i * 40}" fill="none" stroke="${couleur}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="${f(0.45 + i * 0.25)}"/>`,
        )
        .join('');
    case 'sort': {
      const losanges = Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2 + hasard();
        const x = CENTRE_X + Math.cos(angle) * 215 * G;
        const y = CENTRE_Y + Math.sin(angle) * 200 * G;
        return `<path d="M${f(x)} ${f(y - 12)} L${f(x + 9)} ${f(y)} L${f(x)} ${f(y + 12)} L${f(x - 9)} ${f(y)} Z" fill="${couleur}"/>`;
      }).join('');
      return `<ellipse cx="${CENTRE_X}" cy="${CENTRE_Y}" rx="${215 * G}" ry="${200 * G}" fill="none" stroke="${couleur}" stroke-width="3" stroke-dasharray="14 12" opacity="0.6"/>${losanges}`;
    }
    case 'incident': {
      const fissures = Array.from({ length: 3 }, () => {
        let x = CENTRE_X + entre(hasard, -220, 220);
        let y = CENTRE_Y + entre(hasard, -230, -120);
        const segments = [`M${f(x)} ${f(y)}`];
        for (let i = 0; i < 5; i++) {
          x += entre(hasard, -35, 35);
          y += entre(hasard, 40, 75);
          segments.push(`L${f(x)} ${f(y)}`);
        }
        return `<path d="${segments.join(' ')}" fill="none" stroke="#fca5a5" stroke-width="5" stroke-linejoin="round" opacity="0.7"/>`;
      }).join('');
      // Un incident IA ajoute des bandes de « glitch ».
      const glitch = carte.ia
        ? Array.from(
            { length: 5 },
            () =>
              `<rect x="${f(entre(hasard, 250, 750))}" y="${f(entre(hasard, 200, 700))}" width="${f(entre(hasard, 80, 220))}" height="10" fill="#f0abfc" opacity="0.55"/>`,
          ).join('')
        : '';
      return fissures + glitch;
    }
  }
}

/** Dessine l'illustration provisoire d'une carte (US-018, ADR 0016). Déterministe : même carte, même image. */
export function dessinerCarte(carte: Carte): string {
  const hasard = creerHasard(carte.numero);
  const palette = PALETTES[carte.famille];
  const rotation = f(entre(hasard, -8, 8));
  const echelle = f(entre(hasard, 1.05, 1.25) * G);
  const { derriere, devant } = aura(carte.rarete, hasard);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGEUR} ${HAUTEUR}" width="${LARGEUR}" height="${HAUTEUR}">
<defs>
  <radialGradient id="lueur" cx="50%" cy="48%" r="55%"><stop offset="0" stop-color="${palette.moyen}" stop-opacity="0.45"/><stop offset="1" stop-color="${palette.moyen}" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo-epique"><stop offset="0" stop-color="#a78bfa" stop-opacity="0.35"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo-legendaire"><stop offset="0" stop-color="#fbbf24" stop-opacity="0.5"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
  <linearGradient id="corps" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.clair}"/><stop offset="0.55" stop-color="${palette.moyen}"/><stop offset="1" stop-color="${palette.sombre}"/></linearGradient>
</defs>
<rect width="${LARGEUR}" height="${HAUTEUR}" fill="${FOND}"/>
<rect width="${LARGEUR}" height="${HAUTEUR}" fill="url(#lueur)"/>
${etoiles(hasard)}
${constellation(hasard, palette.clair)}
<ellipse cx="${CENTRE_X}" cy="${CENTRE_Y + 360}" rx="330" ry="62" fill="${palette.sombre}" opacity="0.55"/>
${derriere}
${motifType(carte, hasard, palette.clair)}
<g transform="translate(${CENTRE_X} ${CENTRE_Y}) rotate(${rotation}) scale(${echelle})">
  <g transform="translate(14 16)" fill="${FOND}" stroke="${FOND}" stroke-width="0" opacity="0.8">${SILHOUETTES[carte.famille]}</g>
  <g fill="url(#corps)" stroke="url(#corps)" stroke-width="0">${SILHOUETTES[carte.famille]}</g>
  <g fill="${palette.clair}" stroke="${palette.clair}" stroke-width="0" opacity="0.9">${DETAILS[carte.famille]}</g>
</g>
${devant}
</svg>`;
}

const RARETES_ALT: Record<Rarete, string | undefined> = {
  commune: undefined,
  rare: 'un anneau bleu',
  epique: 'un halo violet',
  legendaire: 'un halo doré semé d’étincelles',
};

const TYPES_ALT: Record<Carte['type'], string | undefined> = {
  composant: undefined,
  evolution: 'des chevrons montants',
  sort: 'un cercle de runes',
  incident: 'des fissures',
};

/** Texte alternatif de l'illustration provisoire : ce qu'elle montre, sans le nom de la carte. */
export function texteAlternatif(carte: Carte): string {
  const embleme = DESCRIPTIONS_EMBLEME[carte.famille];
  const ornements = [TYPES_ALT[carte.type], RARETES_ALT[carte.rarete]].filter(Boolean).join(' et ');
  const suite = ornements ? ', avec ' + ornements : '';
  return `Illustration provisoire : ${embleme} sur fond bleu nuit${suite}`;
}
