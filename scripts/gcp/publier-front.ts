/**
 * Publie le front sur Firebase Hosting par son API REST (US-050, ADR 0028), avec le jeton d'accès de gcloud lu sur
 * l'entrée standard : une seule identité, celle du déploiement, sans CLI Firebase ni clé. firebase.json fait foi
 * (hebergement.ts le traduit). Appelé par `scripts/gcp/deployer.sh front`.
 *
 * Usage, depuis la racine du dépôt, une fois le front construit (npm run build) :
 *   gcloud auth print-access-token | node scripts/gcp/publier-front.ts [--sans-publier] [--commit <sha>]
 *   node scripts/gcp/publier-front.ts --simulation
 *
 *   --simulation    lit firebase.json et le build, et affiche ce qui serait publié, sans appeler Firebase
 *   --sans-publier  crée la version et envoie les fichiers (Firebase vérifie la configuration), puis supprime la
 *                   version : rien n'est publié
 *   sans option     crée la version, envoie les fichiers, la finalise, puis la publie sur le canal « live »
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';
import { configurationRest, fichiersAPublier, lireConfiguration } from './hebergement.ts';

const API = 'https://firebasehosting.googleapis.com/v1beta1';
/** Fichiers déclarés par appel à populateFiles (limite de l'API). */
const PAR_LOT = 1000;
const ENVOIS_SIMULTANES = 8;

const { values: options } = parseArgs({
  options: {
    simulation: { type: 'boolean', default: false },
    'sans-publier': { type: 'boolean', default: false },
    commit: { type: 'string' },
  },
});

interface Version {
  name: string;
}

interface Fichiers {
  /** Chemin servi → empreinte SHA-256 du fichier compressé (gzip), ce que demande l'API. */
  empreintes: Record<string, string>;
  /** Empreinte → contenu compressé, à envoyer si Firebase ne le connaît pas encore. */
  contenus: Map<string, Buffer>;
  octets: number;
}

function preparer(racine: string): Fichiers {
  const { hosting } = lireConfiguration(racine);
  const fichiers = fichiersAPublier(racine, hosting);
  if (!fichiers.has('/index.html')) {
    throw new Error(`${hosting.public}/index.html manque : construire le front (npm run build).`);
  }
  const empreintes: Record<string, string> = {};
  const contenus = new Map<string, Buffer>();
  let octets = 0;
  for (const [chemin, disque] of fichiers) {
    const compresse = gzipSync(readFileSync(disque), { level: 9 });
    const empreinte = createHash('sha256').update(compresse).digest('hex');
    empreintes[chemin] = empreinte;
    contenus.set(empreinte, compresse);
    octets += compresse.length;
  }
  return { empreintes, contenus, octets };
}

async function lireEntree(): Promise<string> {
  if (process.stdin.isTTY) return '';
  let texte = '';
  for await (const morceau of process.stdin) texte += String(morceau);
  return texte.trim();
}

/** Client de l'API Hosting : le jeton reste en mémoire, et une réponse en erreur arrête tout avec son message. */
function client(jeton: string, projet: string) {
  const entetes = { Authorization: `Bearer ${jeton}`, 'x-goog-user-project': projet };
  return async function appeler<T>(methode: string, url: string, corps?: unknown): Promise<T> {
    const reponse = await fetch(url, {
      method: methode,
      headers: { ...entetes, 'Content-Type': 'application/json' },
      ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
    });
    const texte = await reponse.text();
    if (!reponse.ok) throw new Error(`${methode} ${url} : HTTP ${reponse.status}\n${texte}`);
    return (texte ? JSON.parse(texte) : {}) as T;
  };
}

async function envoyer(
  jeton: string,
  projet: string,
  adresse: string,
  empreintes: string[],
  contenus: Map<string, Buffer>,
): Promise<void> {
  const file = [...empreintes];
  const travailleur = async () => {
    for (let empreinte = file.shift(); empreinte !== undefined; empreinte = file.shift()) {
      const reponse = await fetch(`${adresse}/${empreinte}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jeton}`,
          'x-goog-user-project': projet,
          'Content-Type': 'application/octet-stream',
        },
        body: contenus.get(empreinte) ?? Buffer.alloc(0),
      });
      if (!reponse.ok) {
        throw new Error(`envoi de ${empreinte} : HTTP ${reponse.status}\n${await reponse.text()}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(ENVOIS_SIMULTANES, file.length) }, travailleur));
}

async function publier(): Promise<void> {
  const racine = process.cwd();
  const { projet, hosting } = lireConfiguration(racine);
  // Site par défaut du projet : il porte le nom du projet (US-049).
  const site = projet;
  const configuration = configurationRest(hosting);
  const { empreintes, contenus, octets } = preparer(racine);
  const nombre = Object.keys(empreintes).length;
  console.log(
    `Front : ${nombre} fichiers (${Math.round(octets / 1024)} Kio compressés) de ${hosting.public}, site ${site}.`,
  );
  if (options.simulation) {
    console.log('Simulation : rien n’est envoyé. Configuration de la version :');
    console.log(JSON.stringify(configuration, null, 2));
    return;
  }

  const jeton = await lireEntree();
  if (!jeton) {
    throw new Error(
      'jeton d’accès attendu sur l’entrée standard (gcloud auth print-access-token).',
    );
  }
  const appeler = client(jeton, projet);
  const commit = options.commit;
  const version = await appeler<Version>('POST', `${API}/sites/${site}/versions`, {
    config: configuration,
  });
  console.log(`Version créée : ${version.name}`);
  let publiee = false;
  try {
    const aEnvoyer = new Set<string>();
    let adresse = '';
    const entrees = Object.entries(empreintes);
    for (let debut = 0; debut < entrees.length; debut += PAR_LOT) {
      const lot = Object.fromEntries(entrees.slice(debut, debut + PAR_LOT));
      const reponse = await appeler<{ uploadUrl: string; uploadRequiredHashes?: string[] }>(
        'POST',
        `${API}/${version.name}:populateFiles`,
        { files: lot },
      );
      adresse = reponse.uploadUrl;
      for (const empreinte of reponse.uploadRequiredHashes ?? []) aEnvoyer.add(empreinte);
    }
    await envoyer(jeton, projet, adresse, [...aEnvoyer], contenus);
    console.log(
      `${aEnvoyer.size} fichier(s) envoyé(s) ; les autres étaient déjà connus de Firebase.`,
    );
    if (options['sans-publier']) return;

    await appeler('PATCH', `${API}/${version.name}?updateMask=status`, { status: 'FINALIZED' });
    const message = commit ? `Commit ${commit}` : 'Publication manuelle';
    const publication = await appeler<{ name: string }>(
      'POST',
      `${API}/sites/${site}/releases?versionName=${encodeURIComponent(version.name)}`,
      { message },
    );
    publiee = true;
    console.log(`Publiée : ${publication.name} → https://${site}.web.app`);
  } finally {
    // Une version jamais publiée ne sert à rien : on la retire (essai, ou échec avant la publication).
    if (!publiee) {
      await appeler('DELETE', `${API}/${version.name}`).then(
        () => console.log(`Version ${version.name} supprimée : rien n’a été publié.`),
        (erreur: unknown) =>
          console.error(`Version ${version.name} non supprimée : ${String(erreur)}`),
      );
    }
  }
}

try {
  await publier();
} catch (erreur) {
  console.error(
    `Publication du front en échec : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
  );
  process.exitCode = 1;
}
