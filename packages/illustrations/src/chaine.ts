import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  declinerIllustration,
  POIDS_MAX,
  verifierOriginal,
  type Declinaison,
} from './declinaisons.ts';
import { genererManifeste } from './manifeste.ts';
import { validerMetadonnees } from './metadonnees.ts';

export interface Chemins {
  /** `set-1.json` : description des illustrations. */
  metadonnees: string;
  /** Dossier des originaux `<numero>.png`. */
  sources: string;
  /** Dossier des déclinaisons servies par le front. */
  sortie: string;
  /** Manifeste TypeScript importé par le front. */
  manifeste: string;
}

export interface Bilan {
  erreurs: string[];
  /** Fichiers écrits dans le dossier de sortie, par nom. */
  fichiers: string[];
}

const EXTENSIONS_SERVIES = /\.(avif|webp)$/;

/** Lit et vérifie l'original d'une carte, puis le décline ; renvoie les déclinaisons ou les erreurs. */
async function declinerCarte(
  numero: number,
  dossierSources: string,
): Promise<{ declinaisons: Declinaison[]; erreurs: string[] }> {
  const cheminOriginal = join(dossierSources, `${numero}.png`);
  const original = await readFile(cheminOriginal).catch(() => undefined);
  if (!original) {
    return {
      declinaisons: [],
      erreurs: [`carte ${numero} : original introuvable (${cheminOriginal})`],
    };
  }
  const defaut = await verifierOriginal(original);
  if (defaut)
    return { declinaisons: [], erreurs: [`carte ${numero} : original trop petit, ${defaut}`] };

  const declinaisons = await declinerIllustration(numero, original);
  const erreurs = declinaisons
    .filter(({ donnees }) => donnees.length >= POIDS_MAX)
    .map(({ nomFichier, donnees }) => {
      const ko = Math.ceil(donnees.length / 1024);
      return `carte ${numero} : ${nomFichier} pèse ${ko} Ko, au-delà de 100 Ko`;
    });
  return { declinaisons, erreurs };
}

/**
 * Toute la chaîne d'US-015 : valide les métadonnées et les originaux, puis écrit les déclinaisons et le manifeste.
 * N'écrit rien tant qu'une erreur subsiste : le dossier servi reste cohérent avec le manifeste.
 */
export async function produireIllustrations(
  chemins: Chemins,
  numerosCartes: ReadonlySet<number>,
): Promise<Bilan> {
  const contenu: unknown = JSON.parse(await readFile(chemins.metadonnees, 'utf8'));
  const { illustrations, erreurs } = validerMetadonnees(contenu, numerosCartes);
  if (erreurs.length) return { erreurs, fichiers: [] };

  const declinaisons: Declinaison[] = [];
  for (const { numero } of illustrations) {
    const resultat = await declinerCarte(numero, chemins.sources);
    declinaisons.push(...resultat.declinaisons);
    erreurs.push(...resultat.erreurs);
  }
  if (erreurs.length) return { erreurs, fichiers: [] };

  await mkdir(chemins.sortie, { recursive: true });
  // Les images d'une carte retirée de set-1.json ne doivent pas rester servies.
  const attendus = new Set(declinaisons.map((d) => d.nomFichier));
  for (const nom of await readdir(chemins.sortie)) {
    if (EXTENSIONS_SERVIES.test(nom) && !attendus.has(nom)) await rm(join(chemins.sortie, nom));
  }
  for (const { nomFichier, donnees } of declinaisons) {
    await writeFile(join(chemins.sortie, nomFichier), donnees);
  }
  await writeFile(chemins.manifeste, await genererManifeste(illustrations));

  return { erreurs: [], fichiers: [...attendus].sort() };
}
