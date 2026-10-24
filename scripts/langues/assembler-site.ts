/**
 * Assemble le site publié après `ng build` (US-079, ADR 0042) : Angular produit un build par langue
 * (`dist/web/browser/fr/`, `/en/`) ; ce script y ajoute ce qu'il ne fait pas lui-même.
 *
 * - les fichiers communs aux langues (illustrations, police, icônes, logo), une seule fois, à la racine ;
 * - pour chaque langue, son manifeste web et, hors langue source, son index.html traduit (coquille.<langue>.json) ;
 *   puis son `ngsw.json`, recalculé puisque ces fichiers ont changé (le service worker vérifie leurs empreintes) ;
 * - la page d'accueil du site (`/`), qui emmène le joueur dans sa langue, et à la place de l'ancien service worker
 *   de la racine, celui d'Angular qui se désinstalle (`safety-worker.js`) : les joueurs d'avant US-079 en sortent.
 *
 * Usage : lancé par `npm run build` (apps/web), depuis n'importe quel dossier.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import {
  balisesApercu,
  type Coquille,
  lireLangues,
  manifesteDe,
  pageAccueil,
  traduireIndex,
} from './site.ts';

const RACINE = resolve(import.meta.dirname, '../..');
const WEB = join(RACINE, 'apps/web');
const SITE = join(WEB, 'dist/web/browser');
const MANIFESTE = 'manifest.webmanifest';
const CLI_NGSW = join(RACINE, 'node_modules/@angular/service-worker/ngsw-config.js');

const lire = (chemin: string): string => readFileSync(chemin, 'utf8');
const langues = lireLangues(WEB);
const source = langues[0];
if (!source) throw new Error('angular.json : aucune langue déclarée (i18n).');
for (const langue of langues) {
  if (!existsSync(join(SITE, langue.sousChemin, 'index.html'))) {
    throw new Error(
      `${langue.sousChemin}/index.html manque : lancer d'abord ng build (production).`,
    );
  }
}

// Fichiers communs : une copie à la racine, adressée en absolu (/cartes/…, /polices/…) par chaque langue.
cpSync(join(WEB, 'public'), SITE, {
  recursive: true,
  filter: (chemin) => basename(chemin) !== MANIFESTE,
});

const manifesteSource = JSON.parse(lire(join(WEB, 'public', MANIFESTE))) as Record<string, unknown>;
for (const langue of langues) {
  const dossier = join(SITE, langue.sousChemin);
  const coquille =
    langue === source
      ? undefined
      : (JSON.parse(lire(join(WEB, `src/locale/coquille.${langue.code}.json`))) as Coquille);
  if (coquille) {
    const index = join(dossier, 'index.html');
    writeFileSync(index, traduireIndex(lire(index), coquille, langue.code));
  }
  writeFileSync(
    join(dossier, MANIFESTE),
    `${JSON.stringify(manifesteDe(manifesteSource, langue, coquille), null, 2)}\n`,
  );
  // Chemins relatifs à la racine du dépôt, à la manière de l'outil (posix, même sous Windows).
  const posix = (chemin: string): string => relative(RACINE, chemin).split('\\').join('/');
  execFileSync(
    process.execPath,
    [CLI_NGSW, posix(dossier), posix(join(WEB, 'ngsw-config.json')), `/${langue.sousChemin}/`],
    { cwd: RACINE, stdio: 'inherit' },
  );
}

// La page d'accueil du site, et le service worker de la racine qui se retire.
const sourceIndex = lire(join(SITE, source.sousChemin, 'index.html'));
writeFileSync(
  join(SITE, 'index.html'),
  pageAccueil(lire(join(WEB, 'racine/index.html')), balisesApercu(sourceIndex)),
);
copyFileSync(join(WEB, 'racine/langue.js'), join(SITE, 'langue.js'));
copyFileSync(join(SITE, source.sousChemin, 'safety-worker.js'), join(SITE, 'ngsw-worker.js'));

const prefixes = langues.map((l) => '/' + l.sousChemin + '/').join(', ');
console.log(`Site assemblé : ${prefixes} et la page d'accueil qui choisit la langue.`);
