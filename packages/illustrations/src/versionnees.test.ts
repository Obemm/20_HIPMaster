import { SET_1 } from '@hipmaster/domain';
import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FORMATS, LARGEURS, nomDeclinaison, POIDS_MAX } from './declinaisons.ts';
import { genererManifeste } from './manifeste.ts';
import { validerMetadonnees } from './metadonnees.ts';

// Garde-fou sur ce qui est réellement versionné et servi par le front (indicateur d'EPIC-05).
const chemin = (relatif: string) => fileURLToPath(new URL(`../${relatif}`, import.meta.url));
const dossierServi = chemin('../../apps/web/public/cartes/set-1/');
const servis = async () =>
  (await readdir(dossierServi).catch(() => [] as string[])).filter((nom) =>
    /\.(avif|webp)$/.test(nom),
  );

const illustrationsDecrites = async () => {
  const contenu: unknown = JSON.parse(await readFile(chemin('set-1.json'), 'utf8'));
  return validerMetadonnees(contenu, new Set(SET_1.map((carte) => carte.numero)));
};

describe('illustrations versionnées du set 1', () => {
  it('set-1.json est valide', async () => {
    expect((await illustrationsDecrites()).erreurs).toEqual([]);
  });

  it('chaque fichier servi pèse moins de 100 Ko', async () => {
    for (const nom of await servis()) {
      expect((await stat(dossierServi + nom)).size, nom).toBeLessThan(POIDS_MAX);
    }
  });

  it('les fichiers servis sont exactement ceux des cartes décrites', async () => {
    const { illustrations } = await illustrationsDecrites();
    const attendus = illustrations.flatMap(({ numero }) =>
      LARGEURS.flatMap((largeur) =>
        FORMATS.map((format) => nomDeclinaison(numero, largeur, format)),
      ),
    );
    expect((await servis()).sort()).toEqual(attendus.sort());
  });

  it('le manifeste du front est à jour (sinon : npm run illustrations)', async () => {
    const { illustrations } = await illustrationsDecrites();
    const manifeste = await readFile(
      chemin('../../apps/web/src/app/cartes/illustrations.generated.ts'),
      'utf8',
    );
    expect(manifeste).toBe(await genererManifeste(illustrations));
  });
});
