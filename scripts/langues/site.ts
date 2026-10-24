/**
 * Le site en plusieurs langues (US-079, ADR 0042) : ce qu'Angular ne traduit pas lui-même. Chaque langue a son build,
 * sous `/fr/` ou `/en/` ; restent `index.html` (avant le démarrage du jeu : description, aperçu des liens partagés,
 * message de chargement) et le manifeste web, traduits ici d'après `apps/web/src/locale/coquille.<langue>.json`.
 * Fonctions pures, utilisées par assembler-site.ts et vérifiées par site.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Langue {
  code: string;
  /** Dossier de son build, et préfixe de ses adresses (`fr` → `/fr/`). */
  sousChemin: string;
  /** Fichier de traduction d'Angular ; absent pour la langue source, le français. */
  traduction?: string;
}

/** Traductions de la coquille d'une langue : le manifeste, et les textes français d'index.html à remplacer. */
export interface Coquille {
  manifeste: { name: string; description: string };
  index: [francais: string, traduit: string][];
}

interface AngularJson {
  projects: {
    web: {
      i18n: {
        sourceLocale: { code: string; subPath: string };
        locales: Record<string, { translation: string; subPath: string }>;
      };
    };
  };
}

/** Les langues du site, lues dans angular.json : la langue source d'abord. */
export function lireLangues(racineWeb: string): Langue[] {
  const angular = JSON.parse(readFileSync(join(racineWeb, 'angular.json'), 'utf8')) as AngularJson;
  const { sourceLocale, locales } = angular.projects.web.i18n;
  return [
    { code: sourceLocale.code, sousChemin: sourceLocale.subPath },
    ...Object.entries(locales).map(([code, { translation, subPath }]) => ({
      code,
      sousChemin: subPath,
      traduction: translation,
    })),
  ];
}

/**
 * index.html dans une langue : chaque texte français de la coquille est remplacé ; un texte introuvable arrête tout,
 * plutôt que de laisser du français sur la version traduite après une retouche d'index.html.
 */
export function traduireIndex(html: string, coquille: Coquille, code: string): string {
  let traduit = html;
  for (const [francais, texte] of coquille.index) {
    if (!traduit.includes(francais)) {
      throw new Error(
        `coquille.${code}.json : « ${francais} » n'est plus dans index.html ; mettre la traduction à jour.`,
      );
    }
    traduit = traduit.replaceAll(francais, texte);
  }
  return traduit;
}

/**
 * Manifeste web d'une langue : la même application (`id` et `scope` communs, le joueur change de langue sans quitter
 * le jeu installé), ouverte dans sa langue ; le navigateur reprend le manifeste de la dernière langue jouée.
 */
export function manifesteDe(
  source: Record<string, unknown>,
  langue: Langue,
  coquille: Coquille | undefined,
): Record<string, unknown> {
  return {
    ...source,
    ...coquille?.manifeste,
    lang: langue.code,
    id: '/',
    scope: '/',
    start_url: `/${langue.sousChemin}/`,
  };
}

/** Les balises de description et d'aperçu des liens partagés (US-061) d'index.html, pour la page d'accueil du site. */
export function balisesApercu(html: string): string[] {
  return [
    ...html.matchAll(
      /<meta\s+(?:name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/g,
    ),
  ].map(([balise]) => balise.replaceAll(/\s+/g, ' '));
}

/** La page d'accueil du site, avec l'aperçu des liens partagés de la langue source à la place du repère. */
export function pageAccueil(gabarit: string, balises: string[]): string {
  const repere = '<!-- aperçu des liens partagés -->';
  if (!gabarit.includes(repere)) {
    throw new Error(`racine/index.html : repère « ${repere} » absent.`);
  }
  return gabarit.replace(repere, balises.join('\n    '));
}
