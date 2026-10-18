/**
 * Simulation « bot contre bot » des decks prêtés (US-011), pour l'équilibrage.
 * Usage : npm run simuler -- [parties par duel, 200 par défaut] [graine, 1 par défaut]
 * Affiche un tableau Markdown, à reporter dans docs/produit/cartes-set-1.md.
 */
import { DECKS_PRETES, simuler } from '../packages/domain/src/index.ts';

const parties = Number(process.argv[2] ?? 200);
const graine = Number(process.argv[3] ?? 1);
const pourcent = (n: number) => `${Math.round((n / parties) * 100)} %`;

console.log(`Simulation : ${parties} parties par duel, graine ${graine}, bot Batch de nuit.\n`);
console.log(
  '| Deck A | Deck B | Victoires A | Victoires B | Nulles | Finies par SLA | Tours moyens |',
);
console.log(
  '| ------ | ------ | ----------- | ----------- | ------ | -------------- | ------------ |',
);
for (const [i, a] of DECKS_PRETES.entries()) {
  for (const b of DECKS_PRETES.slice(i)) {
    const r = simuler(a.cartes, b.cartes, parties, graine);
    const cellules = [
      a.nom,
      b.nom,
      pourcent(r.victoiresA),
      pourcent(r.victoiresB),
      pourcent(r.nulles),
      pourcent(r.finiesParSla),
      r.toursMoyens.toFixed(1),
    ];
    console.log(`| ${cellules.join(' | ')} |`);
  }
}
