/**
 * Firebase Hosting en local, pour les parcours e2e sur le build de production (US-050, ADR 0028) : sert
 * apps/web/dist/web/browser avec les en-têtes et les réécritures de firebase.json, CSP stricte comprise, et relaie
 * /api/** vers l'API locale comme la réécriture vers Cloud Run (sans les cookies, que Hosting ne transmet pas).
 * Seul ajout : un `report-uri` dans la CSP, pour consigner chaque violation ; bilan-csp.ts les relit à la fin.
 *
 * Usage : node e2e/hebergement-local.ts (port 4300), une fois le front construit (npm run build) ; l'API attendue
 * écoute sur API_PORT (3000 par défaut).
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, type IncomingMessage, request, type ServerResponse } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { entetesPour, lireConfiguration, reecriturePour } from '../scripts/gcp/hebergement.ts';

const PORT = 4300;
const API = { host: '127.0.0.1', port: Number(process.env.API_PORT ?? 3000) };
/** Rapports de violation de la CSP : sous /__/, préfixe que Hosting se réserve (aucune route du jeu n'y mène). */
const RAPPORTS = '/__/rapports-csp';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

const racine = resolve(import.meta.dirname, '..');
const { hosting } = lireConfiguration(racine);
const publie = join(racine, hosting.public);
const violations: unknown[] = [];

/** Fichier publié qui correspond au chemin demandé ; jamais hors du dossier publié. */
async function fichierPublie(chemin: string): Promise<string | undefined> {
  let relatif: string;
  try {
    relatif = decodeURIComponent(chemin);
  } catch {
    return undefined;
  }
  if (relatif.endsWith('/')) relatif += 'index.html';
  if (/(?:^|\/)\.\.(?:\/|$)|\\|\0/.test(relatif)) return undefined;
  const disque = join(publie, relatif);
  const infos = await stat(disque).catch(() => undefined);
  return infos?.isFile() ? disque : undefined;
}

function servir(
  disque: string,
  entetes: Record<string, string>,
  requete: IncomingMessage,
  reponse: ServerResponse,
): void {
  reponse.writeHead(200, {
    ...entetes,
    'content-type': TYPES[extname(disque)] ?? 'application/octet-stream',
  });
  if (requete.method === 'HEAD') {
    reponse.end();
    return;
  }
  createReadStream(disque).pipe(reponse);
}

/** Relais vers l'API : ses propres en-têtes priment sur ceux de firebase.json (Cache-Control, notamment). */
function relayer(
  requete: IncomingMessage,
  reponse: ServerResponse,
  entetes: Record<string, string>,
): void {
  const transmis = { ...requete.headers };
  delete transmis.cookie;
  const amont = request(
    { ...API, method: requete.method, path: requete.url, headers: transmis },
    (reponseApi) => {
      reponse.writeHead(reponseApi.statusCode ?? 502, { ...entetes, ...reponseApi.headers });
      reponseApi.pipe(reponse);
    },
  );
  amont.on('error', () => {
    if (!reponse.headersSent) reponse.writeHead(502, entetes);
    reponse.end();
  });
  requete.pipe(amont);
}

async function rapports(requete: IncomingMessage, reponse: ServerResponse): Promise<void> {
  if (requete.method !== 'POST') {
    reponse.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(violations));
    return;
  }
  let corps = '';
  for await (const morceau of requete) corps += String(morceau);
  const rapport = (JSON.parse(corps) as { 'csp-report'?: unknown })['csp-report'] ?? corps;
  violations.push(rapport);
  console.error(`Violation de la CSP : ${JSON.stringify(rapport)}`);
  reponse.writeHead(204).end();
}

async function traiter(requete: IncomingMessage, reponse: ServerResponse): Promise<void> {
  const { pathname } = new URL(requete.url ?? '/', 'http://localhost');
  if (pathname === RAPPORTS) return rapports(requete, reponse);
  const entetes = entetesPour(hosting, pathname);
  const csp = entetes['content-security-policy'];
  if (csp) entetes['content-security-policy'] = `${csp}; report-uri ${RAPPORTS}`;

  const fichier = await fichierPublie(pathname);
  if (fichier) return servir(fichier, entetes, requete, reponse);
  const reecriture = reecriturePour(hosting, pathname);
  if (reecriture?.run) return relayer(requete, reponse, entetes);
  const destination = reecriture?.destination && (await fichierPublie(reecriture.destination));
  if (destination) return servir(destination, entetes, requete, reponse);
  reponse.writeHead(404, entetes).end('Introuvable');
}

createServer((requete, reponse) => {
  traiter(requete, reponse).catch((erreur: unknown) => {
    console.error(erreur);
    if (!reponse.headersSent) reponse.writeHead(500);
    reponse.end();
  });
}).listen(PORT, () => {
  console.log(
    `Firebase Hosting local : http://localhost:${PORT} (${hosting.public}, API sur ${API.port})`,
  );
});
