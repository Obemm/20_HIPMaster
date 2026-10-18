/**
 * Simulation « bot contre bot » des decks prêtés (US-011), pour l'équilibrage.
 * Usage : npm run simuler -- [parties par duel, 200 par défaut] [graine, 1 par défaut]
 * Compare aussi les niveaux du bot (US-021).
 * Affiche un tableau Markdown, à reporter dans docs/produit/cartes-set-1.md.
 */
import { DECKS_PRETES, NIVEAUX_BOT, simuler } from '../packages/domain/src/index.ts';

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

// Niveaux du bot (US-021) : chaque niveau contre le précédent, deck identique des deux côtés pour isoler le jeu.
console.log(`
Niveaux du bot : ${parties} parties par duel et par deck prêté.
`);
console.log('| Niveau A | Niveau B | Victoires A | Victoires B | Nulles |');
console.log('| -------- | -------- | ----------- | ----------- | ------ |');
for (const [i, a] of NIVEAUX_BOT.entries()) {
  for (const b of NIVEAUX_BOT.slice(i + 1)) {
    let victoiresA = 0;
    let victoiresB = 0;
    let nulles = 0;
    for (const deck of DECKS_PRETES) {
      const r = simuler(deck.cartes, deck.cartes, parties, graine, a.strategie, b.strategie);
      victoiresA += r.victoiresA;
      victoiresB += r.victoiresB;
      nulles += r.nulles;
    }
    const total = parties * DECKS_PRETES.length;
    const pct = (n: number) => `${Math.round((n / total) * 100)} %`;
    console.log(
      `| ${a.nom} | ${b.nom} | ${pct(victoiresA)} | ${pct(victoiresB)} | ${pct(nulles)} |`,
    );
  }
}
