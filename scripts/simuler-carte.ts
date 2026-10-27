/**
 * Équilibrage d'une carte proposée (US-029, ADR 0050), selon la méthode d'US-077 : chaque deck prêté reçoit la carte
 * (2 exemplaires, 1 pour une légendaire) à la place des cartes de même type au coût le plus proche, puis affronte les
 * trois decks prêtés ; on compare avec le deck inchangé. Bot Batch de nuit des deux côtés, places alternées.
 *
 * Usage : npm run simuler:carte -- <numéros séparés par des virgules> [parties par duel, 400] [graine, 1]
 *         npm run simuler:carte -- --base <set-1.ts de la branche cible> [parties] [graine]
 * Avec --base, mesure les cartes absentes de ce fichier : c'est ainsi que la CI trouve les cartes d'une PR.
 * Affiche des tableaux Markdown ; compter une minute et demie par carte à 400 parties par duel.
 */
import { pathToFileURL } from 'node:url';
import {
  DECKS_PRETES,
  type Carte,
  SET_1,
  simuler,
  trouverCarte,
} from '../packages/domain/src/index.ts';

/**
 * Écart, en points de victoire, à partir duquel la carte change trop un deck : à 400 parties, une part varie d'environ
 * 2,5 points d'une graine à l'autre ; les decks prêtés sont réglés entre 40 et 60 %.
 */
const ECART_MAX = 10;

async function numerosDemandes(argument: string, base?: string): Promise<number[]> {
  if (argument === '--base' && base) {
    const module = (await import(pathToFileURL(base).href)) as { SET_1: readonly Carte[] };
    const connus = new Set(module.SET_1.map((carte) => carte.numero));
    return SET_1.filter((carte) => !connus.has(carte.numero)).map((carte) => carte.numero);
  }
  return argument.split(',').map(Number);
}

/** Le deck avec la carte : elle remplace les cartes de même type (sinon les autres) au coût le plus proche. */
function avecCarte(deck: readonly number[], carte: Carte): number[] {
  const exemplaires = carte.rarete === 'legendaire' ? 1 : 2;
  const origines = new Set(
    deck.map((n) => trouverCarte(n)).flatMap((c) => (c?.type === 'evolution' ? [c.origine] : [])),
  );
  const candidates = deck
    .map((numero, index) => ({ index, carte: trouverCarte(numero) }))
    .filter(
      ({ carte: c }) =>
        c && c.numero !== carte.numero && c.rarete !== 'legendaire' && !origines.has(c.numero),
    )
    .sort(
      (a, b) =>
        Number(a.carte?.type !== carte.type) - Number(b.carte?.type !== carte.type) ||
        Math.abs((a.carte?.cout ?? 0) - carte.cout) - Math.abs((b.carte?.cout ?? 0) - carte.cout),
    );
  const remplacees = new Set(candidates.slice(0, exemplaires).map(({ index }) => index));
  return [
    ...deck.filter((_, index) => !remplacees.has(index)),
    ...Array.from({ length: exemplaires }, () => carte.numero),
  ];
}

const [argument = '', ...reste] = process.argv.slice(2);
const base = argument === '--base' ? reste.shift() : undefined;
const parties = Number(reste[0] ?? 400);
const graine = Number(reste[1] ?? 1);
const numeros = await numerosDemandes(argument, base);

if (numeros.length === 0) {
  console.log('Aucune carte nouvelle à mesurer.');
  process.exit(0);
}

const part = (victoires: number) => Math.round((victoires / parties) * 100);
const ligne = (cellules: (string | number)[]) => console.log(`| ${cellules.join(' | ')} |`);
let aExaminer = false;

/** Le deck inchangé contre chaque deck prêté : la référence, commune à toutes les cartes mesurées. */
const reference = DECKS_PRETES.map((deck) =>
  DECKS_PRETES.map((adverse) =>
    part(simuler(deck.cartes, adverse.cartes, parties, graine).victoiresA),
  ),
);

for (const numero of numeros) {
  const carte = trouverCarte(numero);
  if (!carte) {
    console.error(`Carte ${numero} inconnue.`);
    process.exit(1);
  }
  console.log(
    `\n### ${carte.numero} — ${carte.nom} (${carte.type}, ${carte.rarete}, coût ${carte.cout})\n`,
  );
  console.log(
    `${parties} parties par duel, graine ${graine}, Batch de nuit des deux côtés. Chaque case : victoires du deck inchangé → du deck avec la carte ; ⚠️ : écart de ${ECART_MAX} points ou plus.\n`,
  );
  ligne(['Deck', ...DECKS_PRETES.map((d) => `contre ${d.nom}`)]);
  ligne(['---', ...DECKS_PRETES.map(() => '---')]);
  for (const [i, deck] of DECKS_PRETES.entries()) {
    const variante = avecCarte(deck.cartes, carte);
    const cases = DECKS_PRETES.map((adverse, j) => {
      const avant = reference[i]?.[j];
      const apres = part(simuler(variante, adverse.cartes, parties, graine).victoiresA);
      const hors = avant === undefined || Math.abs(apres - avant) >= ECART_MAX;
      aExaminer ||= hors;
      return `${avant} % → ${apres} %${hors ? ' ⚠️' : ''}`;
    });
    ligne([deck.nom, ...cases]);
  }
}

console.log(
  aExaminer
    ? `\n⚠️ Avec la carte, au moins un deck gagne ou perd ${ECART_MAX} points ou plus : à confirmer sur une autre graine, puis à ajuster.`
    : `\nAvec la carte, aucun deck ne gagne ni ne perd ${ECART_MAX} points ou plus.`,
);
