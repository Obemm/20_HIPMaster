import { SET_1 } from '@hipmaster/domain';
import { fileURLToPath } from 'node:url';
import { produireIllustrations } from './chaine.ts';

// `npm run illustrations` : déclinaisons et manifeste du set 1 (US-015, ADR 0015).
const depuisPaquet = (chemin: string) => fileURLToPath(new URL(`../${chemin}`, import.meta.url));

const { erreurs, fichiers } = await produireIllustrations(
  {
    metadonnees: depuisPaquet('set-1.json'),
    sources: depuisPaquet('sources/set-1'),
    sortie: depuisPaquet('../../apps/web/public/cartes/set-1'),
    manifeste: depuisPaquet('../../apps/web/src/app/cartes/illustrations.generated.ts'),
  },
  new Set(SET_1.map((carte) => carte.numero)),
);

if (erreurs.length) {
  console.error(`Rien n'a été écrit : ${erreurs.length} erreur(s) à corriger.`);
  for (const erreur of erreurs) console.error(`  - ${erreur}`);
  process.exitCode = 1;
} else {
  console.log(
    `${fichiers.length / 4} illustration(s), ${fichiers.length} fichier(s) dans apps/web/public/cartes/set-1.`,
  );
}
