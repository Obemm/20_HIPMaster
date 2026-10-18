import { SET_1 } from '@hipmaster/domain';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { produireIllustrations } from '../chaine.ts';
import { dessinerCarte, texteAlternatif } from './dessin.ts';

// `npm run illustrations:provisoires` : dessine les 71 cartes (US-018, ADR 0016), puis lance la chaîne d'US-015.
const depuisPaquet = (chemin: string) => fileURLToPath(new URL(`../../${chemin}`, import.meta.url));
const sources = depuisPaquet('sources/set-1');
const aujourdhui = new Date().toISOString().slice(0, 10);

await mkdir(sources, { recursive: true });
for (const carte of SET_1) {
  // Rendu à 1365 × 1024 : au-delà des 640 px de la plus grande déclinaison.
  await sharp(Buffer.from(dessinerCarte(carte)), { density: 82 })
    .resize(1365, 1024)
    .png()
    .toFile(join(sources, `${carte.numero}.png`));
}

const illustrations = SET_1.map((carte) => ({
  numero: carte.numero,
  alt: texteAlternatif(carte),
  consigne: 'Illustration vectorielle générée par packages/illustrations/src/vectoriel (US-018)',
  provenance: { outil: 'Générateur vectoriel HIPMaster', date: aujourdhui },
}));
await writeFile(
  depuisPaquet('set-1.json'),
  `${JSON.stringify(
    {
      $commentaire:
        "Une entrée par carte illustrée du set 1 (US-015, ADR 0015). L'original va dans sources/set-1/<numero>.png.",
      illustrations,
    },
    null,
    2,
  )}\n`,
);

const { erreurs, fichiers } = await produireIllustrations(
  {
    metadonnees: depuisPaquet('set-1.json'),
    sources,
    sortie: depuisPaquet('../../apps/web/public/cartes/set-1'),
    manifeste: depuisPaquet('../../apps/web/src/app/cartes/illustrations.generated.ts'),
  },
  new Set(SET_1.map((carte) => carte.numero)),
);

if (erreurs.length) {
  console.error(`Rien n'a été écrit dans le front : ${erreurs.length} erreur(s).`);
  for (const erreur of erreurs) console.error(`  - ${erreur}`);
  process.exitCode = 1;
} else {
  console.log(
    `${SET_1.length} cartes dessinées, ${fichiers.length} fichiers dans apps/web/public/cartes/set-1.`,
  );
}
