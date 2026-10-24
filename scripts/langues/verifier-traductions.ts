/**
 * Contrôle des traductions de l'interface (US-079, ADR 0042), lancé par la CI : `npm run i18n:verifier`.
 *
 * 1. Les textes à traduire extraits du code (`ng extract-i18n`) sont ceux de `apps/web/src/locale/messages.json` :
 *    un texte ajouté ou retouché sans relancer l'extraction (`npm run i18n:extraire`) est signalé.
 * 2. Chaque langue traduit chacun de ces textes, sans traduction orpheline (texte disparu ou retouché).
 * 3. Chaque langue autre que le français a sa coquille (`coquille.<langue>.json` : manifeste et index.html).
 *
 * Le build de production échoue aussi sur une traduction manquante (`i18nMissingTranslation: error`) ; ce contrôle
 * dit en plus laquelle, et repère les orphelines.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { lireLangues } from './site.ts';
import { comparerTraductions, type FichierTraductions } from './traductions.ts';

const RACINE = resolve(import.meta.dirname, '../..');
const WEB = join(RACINE, 'apps/web');
const MESSAGES = join(WEB, 'src/locale/messages.json');

const lire = (chemin: string): FichierTraductions =>
  JSON.parse(readFileSync(chemin, 'utf8')) as FichierTraductions;

const temporaire = mkdtempSync(join(tmpdir(), 'hipmaster-i18n-'));
const problemes: string[] = [];
try {
  execFileSync(
    process.execPath,
    [
      join(RACINE, 'node_modules/@angular/cli/bin/ng.js'),
      'extract-i18n',
      '--output-path',
      temporaire,
    ],
    { cwd: WEB, stdio: ['ignore', 'ignore', 'inherit'] },
  );
  const extraits = lire(join(temporaire, 'messages.json')).translations;
  const commites = lire(MESSAGES).translations;
  const ecart = comparerTraductions(extraits, commites);
  if (ecart.manquantes.length > 0 || ecart.orphelines.length > 0 || ecart.modifiees.length > 0) {
    problemes.push(
      `apps/web/src/locale/messages.json n'est pas à jour (${ecart.manquantes.length} nouveaux textes, ` +
        `${ecart.modifiees.length} modifiés, ${ecart.orphelines.length} disparus) : lancer npm run i18n:extraire.`,
    );
  }
  for (const langue of lireLangues(WEB).slice(1)) {
    const fichier = join(WEB, langue.traduction ?? '');
    if (!existsSync(fichier)) {
      problemes.push(`${langue.code} : fichier de traduction ${langue.traduction ?? '?'} absent.`);
      continue;
    }
    const { manquantes, orphelines } = comparerTraductions(extraits, lire(fichier).translations);
    for (const id of manquantes) {
      problemes.push(
        `${langue.code} : traduction manquante pour ${id} (« ${extraits[id] ?? ''} »).`,
      );
    }
    for (const id of orphelines) {
      problemes.push(
        `${langue.code} : traduction orpheline ${id} (son texte a disparu ou changé).`,
      );
    }
    if (!existsSync(join(WEB, `src/locale/coquille.${langue.code}.json`))) {
      problemes.push(`${langue.code} : src/locale/coquille.${langue.code}.json absent.`);
    }
  }
} finally {
  rmSync(temporaire, { recursive: true, force: true });
}

if (problemes.length > 0) {
  console.error(problemes.join('\n'));
  process.exit(1);
}
console.log(
  'Traductions complètes : chaque texte de l’interface a sa traduction dans chaque langue.',
);
