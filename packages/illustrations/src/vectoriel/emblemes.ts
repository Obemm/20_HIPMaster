import type { Famille } from '@hipmaster/domain';

/** Palette d'une famille (docs/produit/direction-artistique.md) : clair, moyen, sombre. */
export interface Palette {
  clair: string;
  moyen: string;
  sombre: string;
}

export const PALETTES: Record<Famille, Palette> = {
  fichiers: { clair: '#fcd34d', moyen: '#f59e0b', sombre: '#9a3412' },
  esb: { clair: '#bae6fd', moyen: '#38bdf8', sombre: '#1e40af' },
  api: { clair: '#a7f3d0', moyen: '#10b981', sombre: '#065f46' },
  ipaas: { clair: '#99f6e4', moyen: '#2dd4bf', sombre: '#155e75' },
  eda: { clair: '#ddd6fe', moyen: '#8b5cf6', sombre: '#3730a3' },
  ia: { clair: '#f5d0fe', moyen: '#d946ef', sombre: '#581c87' },
  patterns: { clair: '#e2e8f0', moyen: '#94a3b8', sombre: '#334155' },
  bestiaire: { clair: '#fecaca', moyen: '#ef4444', sombre: '#881337' },
};

/** Ce que montre l'emblème, pour le texte alternatif. */
export const DESCRIPTIONS_EMBLEME: Record<Famille, string> = {
  fichiers: 'une pile de documents',
  esb: 'un moyeu relié à des connecteurs en étoile',
  api: 'une porte fortifiée',
  ipaas: 'un nuage muni d’un connecteur',
  eda: 'une source qui émet des ondes',
  ia: 'un œil lumineux relié à un réseau de nœuds',
  patterns: 'un engrenage',
  bestiaire: 'une créature menaçante',
};

const engrenage = (dents: number, rayonExt: number, rayonInt: number) => {
  const points: string[] = [];
  for (let i = 0; i < dents * 4; i++) {
    const angle = (i / (dents * 4)) * Math.PI * 2;
    const rayon = i % 4 < 2 ? rayonExt : rayonInt;
    points.push(`${(Math.cos(angle) * rayon).toFixed(1)},${(Math.sin(angle) * rayon).toFixed(1)}`);
  }
  return `<polygon points="${points.join(' ')}"/>`;
};

/**
 * Silhouette de chaque emblème, centrée sur (0, 0), d'environ 260 unités de large. Les formes sont dessinées sans
 * couleur : l'appelant les peint (ombre, corps, reflets) avec la palette de la famille.
 */
export const SILHOUETTES: Record<Famille, string> = {
  fichiers: [
    '<rect x="-95" y="-125" width="170" height="215" rx="14"/>',
    '<rect x="-80" y="-108" width="170" height="215" rx="14"/>',
    '<path d="M-65 -90 H55 L95 -50 V125 H-65 Z"/>',
  ].join(''),
  esb: [
    ...Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const x = (Math.cos(angle) * 125).toFixed(1);
      const y = (Math.sin(angle) * 125).toFixed(1);
      return `<rect x="-9" y="0" width="18" height="125" rx="9" transform="rotate(${(i * 45 - 90).toFixed(0)})"/><circle cx="${x}" cy="${y}" r="24"/>`;
    }),
    '<circle r="62"/>',
  ].join(''),
  api: [
    '<path d="M-130 125 V-75 L-100 -105 L-70 -75 V-40 H70 V-75 L100 -105 L130 -75 V125 H45 V35 A45 45 0 0 0 -45 35 V125 Z"/>',
  ].join(''),
  ipaas: [
    '<circle cx="-62" cy="10" r="58"/><circle cx="8" cy="-35" r="78"/><circle cx="78" cy="15" r="55"/>',
    '<rect x="-120" y="10" width="250" height="68" rx="34"/>',
    '<rect x="-18" y="70" width="36" height="55" rx="6"/><rect x="-36" y="112" width="72" height="22" rx="6"/>',
  ].join(''),
  eda: [
    '<circle r="34"/>',
    ...[70, 110, 150].map(
      (rayon) =>
        `<path d="M${-rayon * 0.7} ${-rayon * 0.7} A${rayon} ${rayon} 0 0 0 ${-rayon * 0.7} ${rayon * 0.7}" fill="none" stroke-width="20" stroke-linecap="round"/>` +
        `<path d="M${rayon * 0.7} ${-rayon * 0.7} A${rayon} ${rayon} 0 0 1 ${rayon * 0.7} ${rayon * 0.7}" fill="none" stroke-width="20" stroke-linecap="round"/>`,
    ),
  ].join(''),
  ia: [
    ...Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = (Math.cos(angle) * 130).toFixed(1);
      const y = (Math.sin(angle) * 110).toFixed(1);
      return `<line x1="0" y1="0" x2="${x}" y2="${y}" stroke-width="10"/><circle cx="${x}" cy="${y}" r="20"/>`;
    }),
    '<ellipse rx="85" ry="58"/>',
  ].join(''),
  patterns: [engrenage(10, 125, 98), '<circle r="70"/>'].join(''),
  bestiaire: [
    ...[-1, 1].flatMap((cote) =>
      [-40, 0, 40].map(
        (y) =>
          `<path d="M${cote * 60} ${y} L${cote * 125} ${y - 25} L${cote * 140} ${y + 20}" fill="none" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`,
      ),
    ),
    '<ellipse cy="15" rx="80" ry="95"/><circle cy="-95" r="48"/>',
  ].join(''),
};

/** Détails clairs posés sur l'emblème (yeux, lignes, moyeu), peints avec la teinte claire. */
export const DETAILS: Record<Famille, string> = {
  fichiers:
    '<path d="M55 -90 V-50 H95" fill="none" stroke-width="8"/>' +
    [-30, 5, 40, 75].map((y) => `<rect x="-42" y="${y}" width="110" height="10" rx="5"/>`).join(''),
  esb: '<circle r="30"/><circle r="12" fill="#0b1023"/>',
  api: '<circle cx="0" cy="-5" r="16"/><rect x="-6" y="5" width="12" height="28" rx="4"/>',
  ipaas: '<circle cx="-40" cy="-20" r="10"/><circle cx="20" cy="-55" r="14"/>',
  eda: '<circle r="14" fill="#0b1023"/>',
  ia: '<ellipse rx="34" ry="34"/><circle r="15" fill="#0b1023"/>',
  patterns: '<circle r="38" fill="#0b1023"/>',
  bestiaire:
    '<circle cx="-18" cy="-102" r="10"/><circle cx="18" cy="-102" r="10"/>' +
    '<path d="M-30 -70 L-15 -80 L0 -70 L15 -80 L30 -70" fill="none" stroke-width="6"/>',
};
