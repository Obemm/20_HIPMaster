/** Langues des ressources externes : le joueur sait avant de cliquer s'il lira de l'anglais. */
export const LANGUES_LIEN = ['fr', 'en'] as const;
export type LangueLien = (typeof LANGUES_LIEN)[number];

/** Une ressource pour aller plus loin : Wikipédia, documentation d'éditeur, standard (ADR 0034). */
export interface LienExterne {
  titre: string;
  /** Adresse `https` absolue, ouverte et vérifiée avant d'être publiée. */
  url: string;
  langue: LangueLien;
}

/**
 * La fiche « En savoir plus » d'une carte (US-073, ADR 0034) : la profondeur à la demande, qui se lit en moins d'une
 * minute. Le texte court et ludique reste sur la carte (`enVrai`) ; la fiche, elle, reste exacte.
 */
export interface Fiche {
  /** Ce que c'est, en une phrase. */
  definition: string;
  /** À quoi ça sert ; pour un incident, comment il survient. */
  usage: string;
  /** Un exemple concret, tiré de la vie d'une équipe d'intégration. */
  exemple: string;
  /** Le piège à éviter ou la bonne pratique. */
  aRetenir: string;
  /** Le lien avec l'intégration chez Elis, seulement quand il est public et déjà établi (rien d'inventé). */
  chezElis?: string;
  /** De une à trois ressources externes. */
  liens: readonly LienExterne[];
}

/** Bornes de lisibilité d'une fiche, en caractères (environ 200 mots en tout : moins d'une minute de lecture). */
export const LIMITES_FICHE = {
  definition: 220,
  usage: 360,
  exemple: 360,
  aRetenir: 320,
  chezElis: 240,
  total: 1300,
  liens: { min: 1, max: 3 },
} as const;

const CHAMPS_TEXTE = ['definition', 'usage', 'exemple', 'aRetenir', 'chezElis'] as const;

/** Liste ce qui ne va pas dans une fiche (champ vide ou trop long, lien invalide) ; vide si elle est conforme. */
export function problemesFiche(fiche: Fiche): string[] {
  const problemes: string[] = [];
  let total = 0;
  for (const champ of CHAMPS_TEXTE) {
    const texte = fiche[champ];
    if (texte === undefined && champ === 'chezElis') continue;
    const longueur = texte?.trim().length ?? 0;
    total += longueur;
    if (longueur === 0) problemes.push(`${champ} : vide`);
    else if (longueur > LIMITES_FICHE[champ])
      problemes.push(`${champ} : ${longueur} caractères (au plus ${LIMITES_FICHE[champ]})`);
  }
  if (total > LIMITES_FICHE.total)
    problemes.push(`fiche : ${total} caractères (au plus ${LIMITES_FICHE.total})`);

  const { min, max } = LIMITES_FICHE.liens;
  if (fiche.liens.length < min || fiche.liens.length > max)
    problemes.push(`liens : ${fiche.liens.length} (de ${min} à ${max})`);
  if (new Set(fiche.liens.map((lien) => lien.url)).size !== fiche.liens.length)
    problemes.push('liens : adresse en double');
  for (const lien of fiche.liens) problemes.push(...problemesLien(lien));
  return problemes;
}

function problemesLien(lien: LienExterne): string[] {
  const problemes: string[] = [];
  if (!lien.titre.trim()) problemes.push(`lien ${lien.url} : titre vide`);
  if (!LANGUES_LIEN.includes(lien.langue))
    problemes.push(`lien ${lien.url} : langue « ${lien.langue} » inconnue`);
  if (!URL.canParse(lien.url)) problemes.push(`lien ${lien.url} : adresse invalide`);
  else if (new URL(lien.url).protocol !== 'https:')
    problemes.push(`lien ${lien.url} : adresse non https`);
  return problemes;
}
