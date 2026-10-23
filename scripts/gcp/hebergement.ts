/**
 * firebase.json lu comme Firebase Hosting le lit (US-050, ADR 0028), pour deux usages :
 * - publier-front.ts le traduit en configuration de l'API REST de Hosting ;
 * - le serveur local des parcours e2e (e2e/hebergement-local.ts) applique les mêmes en-têtes et réécritures.
 *
 * Règles de Hosting : motifs `source` en glob avec extglob (`@(a|b)`, `+(…)`), ou `regex` ; toutes les règles
 * d'en-têtes qui correspondent au chemin demandé s'appliquent, dans l'ordre, et la dernière l'emporte (confirmé par
 * l'équipe Firebase, firebase-tools#9467) ; pour les réécritures, la première qui correspond l'emporte ; un fichier
 * publié passe avant toute réécriture.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export interface EnTete {
  key: string;
  value: string;
}

/** Motif d'une règle : `source` (glob, recommandé par Firebase) ou `regex` (RE2). */
export interface Motif {
  source?: string;
  regex?: string;
}

export interface RegleEnTetes extends Motif {
  headers: EnTete[];
}

export interface Reecriture extends Motif {
  destination?: string;
  run?: { serviceId: string; region?: string };
}

export interface Hosting {
  public: string;
  ignore?: string[];
  headers?: RegleEnTetes[];
  rewrites?: Reecriture[];
}

export interface Configuration {
  /** Projet Firebase par défaut (.firebaserc) : son site par défaut porte le même nom. */
  projet: string;
  hosting: Hosting;
}

/** Configuration d'une version pour l'API REST de Hosting (`ServingConfig`). */
export interface ConfigurationRest {
  headers: ({ glob?: string; regex?: string } & { headers: Record<string, string> })[];
  rewrites: ({ glob?: string; regex?: string } & {
    path?: string;
    run?: { serviceId: string; region: string };
  })[];
}

/** Clés de firebase.json que ce module sait traduire : une autre arrête la publication plutôt que d'être oubliée. */
const CLES_CONNUES = new Set(['public', 'ignore', 'headers', 'rewrites']);

export function lireConfiguration(racine: string): Configuration {
  const firebase = JSON.parse(readFileSync(join(racine, 'firebase.json'), 'utf8')) as {
    hosting?: Hosting | Hosting[];
  };
  const firebaserc = JSON.parse(readFileSync(join(racine, '.firebaserc'), 'utf8')) as {
    projects?: { default?: string };
  };
  const hosting = firebase.hosting;
  const projet = firebaserc.projects?.default;
  if (!hosting || Array.isArray(hosting)) {
    throw new Error('firebase.json : un seul site « hosting » est attendu.');
  }
  if (!projet) throw new Error('.firebaserc : le projet par défaut manque.');
  const inconnues = Object.keys(hosting).filter((cle) => !CLES_CONNUES.has(cle));
  if (inconnues.length > 0) {
    throw new Error(
      `firebase.json : « ${inconnues.join(', ')} » n'est pas encore pris en charge par scripts/gcp/hebergement.ts.`,
    );
  }
  return { projet, hosting };
}

/**
 * Expression régulière équivalente à un glob de Hosting : `**` traverse les dossiers (suivi d'une barre oblique, il
 * désigne zéro ou plusieurs dossiers), `*` et `?` s'arrêtent à `/`, puis `[…]`, `{a,b}` et les extglobs `@(…)`,
 * `+(…)`, `*(…)`, `?(…)`. Un `!` en tête inverse le motif.
 */
export function globVersRegExp(glob: string): { regexp: RegExp; inverse: boolean } {
  const inverse = glob.startsWith('!');
  return { regexp: new RegExp(`^${convertir(inverse ? glob.slice(1) : glob)}$`), inverse };
}

const QUANTITES: Record<string, string> = { '@': '', '+': '+', '*': '*', '?': '?' };

function convertir(motif: string): string {
  let sortie = '';
  let i = 0;
  while (i < motif.length) {
    const [morceau, longueur] = jeton(motif, i);
    sortie += morceau;
    i += longueur;
  }
  return sortie;
}

/** Traduit l'élément du glob qui commence en `i` : son équivalent en expression régulière, et sa longueur. */
function jeton(motif: string, i: number): [string, number] {
  const c = motif.charAt(i);
  const suivant = motif.charAt(i + 1);
  if (c === '*' && suivant === '*') {
    return motif.charAt(i + 2) === '/' ? ['(?:.*/)?', 3] : ['.*', 2];
  }
  if (c in QUANTITES && suivant === '(') {
    const fin = fermante(motif, i + 1);
    const alternatives = decouper(motif.slice(i + 2, fin), '|').map(convertir);
    return [`(?:${alternatives.join('|')})${QUANTITES[c] ?? ''}`, fin + 1 - i];
  }
  if (c === '{') {
    const fin = fermante(motif, i);
    return [
      `(?:${decouper(motif.slice(i + 1, fin), ',')
        .map(convertir)
        .join('|')})`,
      fin + 1 - i,
    ];
  }
  if (c === '[') {
    const fin = motif.indexOf(']', i + 1);
    if (fin < 0) throw new Error(`glob invalide (crochet non fermé) : ${motif}`);
    return [`[${motif.slice(i + 1, fin).replace(/^!/, '^')}]`, fin + 1 - i];
  }
  if (c === '*') return ['[^/]*', 1];
  if (c === '?') return ['[^/]', 1];
  return [c.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`), 1];
}

/** Position de la parenthèse ou de l'accolade qui ferme celle ouverte en `debut`. */
function fermante(motif: string, debut: number): number {
  const ouvrante = motif.charAt(debut);
  const attendue = ouvrante === '(' ? ')' : '}';
  let profondeur = 0;
  for (let i = debut; i < motif.length; i++) {
    if (motif.charAt(i) === ouvrante) profondeur++;
    if (motif.charAt(i) === attendue && --profondeur === 0) return i;
  }
  throw new Error(`glob invalide (« ${ouvrante} » non fermée) : ${motif}`);
}

/** Découpe `texte` sur `separateur`, sauf à l'intérieur de parenthèses ou d'accolades. */
function decouper(texte: string, separateur: string): string[] {
  const parties: string[] = [];
  let profondeur = 0;
  let debut = 0;
  for (let i = 0; i < texte.length; i++) {
    const c = texte.charAt(i);
    if (c === '(' || c === '{') profondeur++;
    if (c === ')' || c === '}') profondeur--;
    if (c === separateur && profondeur === 0) {
      parties.push(texte.slice(debut, i));
      debut = i + 1;
    }
  }
  parties.push(texte.slice(debut));
  return parties;
}

export function correspond(regle: Motif, chemin: string): boolean {
  if (regle.regex !== undefined) return new RegExp(regle.regex).test(chemin);
  if (regle.source === undefined) return false;
  const { regexp, inverse } = globVersRegExp(regle.source);
  return regexp.test(chemin) !== inverse;
}

/**
 * En-têtes que Hosting ajoute à la réponse pour `chemin` (le chemin demandé, avant toute réécriture), noms en
 * minuscules : toutes les règles qui correspondent, dans l'ordre, la dernière l'emportant.
 */
export function entetesPour(hosting: Hosting, chemin: string): Record<string, string> {
  const entetes: Record<string, string> = {};
  for (const regle of hosting.headers ?? []) {
    if (!correspond(regle, chemin)) continue;
    for (const { key, value } of regle.headers) entetes[key.toLowerCase()] = value;
  }
  return entetes;
}

/** Réécriture appliquée à `chemin` quand aucun fichier publié ne lui correspond : la première qui correspond. */
export function reecriturePour(hosting: Hosting, chemin: string): Reecriture | undefined {
  return hosting.rewrites?.find((regle) => correspond(regle, chemin));
}

function motifRest(regle: Motif): { glob?: string; regex?: string } {
  if (regle.regex !== undefined) return { regex: regle.regex };
  if (regle.source !== undefined) return { glob: regle.source };
  throw new Error('firebase.json : une règle sans « source » ni « regex ».');
}

/** Traduction de firebase.json pour l'API REST (ce que fait la CLI Firebase avant de créer une version). */
export function configurationRest(hosting: Hosting): ConfigurationRest {
  return {
    headers: (hosting.headers ?? []).map((regle) => ({
      ...motifRest(regle),
      headers: Object.fromEntries(regle.headers.map(({ key, value }) => [key, value])),
    })),
    rewrites: (hosting.rewrites ?? []).map((regle) => {
      if (regle.run) {
        // Sans région, Hosting viserait us-central1.
        return {
          ...motifRest(regle),
          run: { serviceId: regle.run.serviceId, region: regle.run.region ?? 'us-central1' },
        };
      }
      if (regle.destination !== undefined) return { ...motifRest(regle), path: regle.destination };
      throw new Error(
        'firebase.json : seules les réécritures « destination » et « run » sont prises en charge.',
      );
    }),
  };
}

/** Fichiers publiés : chemin servi (`/index.html`) → chemin sur le disque, hors motifs `ignore` de firebase.json. */
export function fichiersAPublier(racine: string, hosting: Hosting): Map<string, string> {
  const dossier = join(racine, hosting.public);
  const ignores = (hosting.ignore ?? []).map((source) => ({ source }));
  const fichiers = new Map<string, string>();
  for (const entree of readdirSync(dossier, { recursive: true, withFileTypes: true })) {
    if (!entree.isFile()) continue;
    const disque = join(entree.parentPath, entree.name);
    const chemin = relative(dossier, disque).split(sep).join('/');
    if (ignores.some((motif) => correspond(motif, chemin))) continue;
    fichiers.set(`/${chemin}`, disque);
  }
  return new Map([...fichiers].sort(([a], [b]) => a.localeCompare(b)));
}
