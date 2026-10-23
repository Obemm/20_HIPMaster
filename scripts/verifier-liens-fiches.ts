/**
 * Vérifie les liens externes des fiches « En savoir plus » (US-074, ADR 0034).
 * Usage : npm run fiches:liens
 * Ouvre chaque adresse (redirections suivies) et affiche son statut et le titre de la page, pour relire qu'elle parle
 * du bon sujet. Sort en erreur si un lien ne répond pas en 2xx. Réseau requis : ce n'est pas un test de la CI.
 */
import { FICHES_PAR_FAMILLE, SET_1, type LienExterne } from '../packages/domain/src/index.ts';

const NAVIGATEUR = 'Mozilla/5.0 (compatible; HIPMaster-verification-liens)';

interface Resultat {
  statut: number | string;
  titre: string;
}

async function ouvrir(url: string): Promise<Resultat> {
  try {
    const reponse = await fetch(url, {
      headers: { 'User-Agent': NAVIGATEUR, 'Accept-Language': 'fr,en;q=0.8' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
    const page = await reponse.text();
    const titre = /<title[^>]*>([^<]*)/i.exec(page)?.[1]?.trim().replace(/\s+/g, ' ') ?? '';
    return { statut: reponse.status, titre };
  } catch (erreur) {
    return { statut: erreur instanceof Error ? erreur.name : 'erreur', titre: '' };
  }
}

const nom = (numero: number) => SET_1.find((carte) => carte.numero === numero)?.nom ?? '?';
const liens: { numero: number; lien: LienExterne }[] = Object.values(FICHES_PAR_FAMILLE).flatMap(
  (fiches) =>
    Object.entries(fiches).flatMap(([numero, fiche]) =>
      fiche.liens.map((lien) => ({ numero: Number(numero), lien })),
    ),
);

// Une adresse partagée par plusieurs fiches n'est ouverte qu'une fois, et pas plus de six à la fois.
const resultats = new Map<string, Promise<Resultat>>();
const enCours: Promise<unknown>[] = [];
for (const { lien } of liens) {
  if (resultats.has(lien.url)) continue;
  if (enCours.length >= 6) await enCours.shift();
  const promesse = ouvrir(lien.url);
  resultats.set(lien.url, promesse);
  enCours.push(promesse);
}

let morts = 0;
for (const { numero, lien } of liens) {
  const { statut, titre } = await (resultats.get(lien.url) as Promise<Resultat>);
  const ok = typeof statut === 'number' && statut >= 200 && statut < 300;
  if (!ok) morts++;
  console.log(
    `${ok ? 'ok ' : 'KO '} ${statut} | n° ${numero} ${nom(numero)} | ${lien.titre} | ${titre}`,
  );
}
console.log(`\n${liens.length} liens, ${resultats.size} adresses, ${morts} en échec.`);
process.exitCode = morts ? 1 : 0;
