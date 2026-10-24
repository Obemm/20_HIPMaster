/**
 * Simulations « bot contre bot » pour l'équilibrage (US-011, US-021, US-064).
 * Usage : npm run simuler -- [parties par duel, 200 par défaut] [graine, 1 par défaut]
 * 1. Decks prêtés : Batch de nuit des deux côtés, en alternant les places (US-011).
 * 2. Niveaux du bot deux à deux, même deck des deux côtés pour isoler le jeu (US-021).
 * 3. Avantage du premier joueur : chaque niveau, et le profil débutant, contre lui-même (US-064).
 * 4. Chaque niveau contre un joueur débutant et contre un joueur du niveau de Batch de nuit (US-064).
 * 5. Un joueur qui suit toujours le conseil (US-066) contre Stagiaire et Batch de nuit.
 * Les mesures 3 à 5 croisent les decks prêtés : `parties` parties pour chacune des 9 paires de decks.
 * Affiche des tableaux Markdown, à reporter dans docs/produit/cartes-set-1.md. Compter de dix à vingt minutes à 200.
 */
import {
  choisirActionBatchDeNuit,
  choisirActionDebutant,
  conseiller,
  DECKS_PRETES,
  NIVEAUX_BOT,
  type ResultatSimulation,
  simuler,
  simulerCroise,
  type Strategie,
} from '../packages/domain/src/index.ts';

const parties = Number(process.argv[2] ?? 200);
const graine = Number(process.argv[3] ?? 1);
const pourcent = (n: number, total = parties) =>
  total ? `${Math.round((n / total) * 100)} %` : '—';
const ligne = (cellules: (string | number)[]) => console.log(`| ${cellules.join(' | ')} |`);
function entete(titres: string[]): void {
  ligne(titres);
  ligne(titres.map((titre) => '-'.repeat(titre.length)));
}

console.log(`Simulation : ${parties} parties par duel, graine ${graine}, bot Batch de nuit.\n`);
entete([
  'Deck A',
  'Deck B',
  'Victoires A',
  'Victoires B',
  'Nulles',
  'Finies par SLA',
  'Tours moyens',
]);
for (const [i, a] of DECKS_PRETES.entries()) {
  for (const b of DECKS_PRETES.slice(i)) {
    const r = simuler(a.cartes, b.cartes, parties, graine);
    ligne([
      a.nom,
      b.nom,
      pourcent(r.victoiresA),
      pourcent(r.victoiresB),
      pourcent(r.nulles),
      pourcent(r.finiesParSla),
      r.toursMoyens.toFixed(1),
    ]);
  }
}

// Niveaux du bot (US-021) : chaque niveau contre les suivants, deck identique des deux côtés pour isoler le jeu.
console.log(`\nNiveaux du bot : ${parties} parties par duel et par deck prêté.\n`);
entete(['Niveau A', 'Niveau B', 'Victoires A', 'Victoires B', 'Nulles']);
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
    ligne([
      a.nom,
      b.nom,
      pourcent(victoiresA, total),
      pourcent(victoiresB, total),
      pourcent(nulles, total),
    ]);
  }
}

const decks = DECKS_PRETES.map((deck) => deck.cartes);
const croiser = (a: Strategie, b: Strategie = a) => simulerCroise(decks, parties, graine, a, b);
const parMesure = parties * decks.length ** 2;

// Avantage du premier joueur (US-064) : en miroir, le premier et le second devraient gagner chacun près de 50 %.
console.log(
  `\nPremier et second joueur, chacun contre lui-même : ${parMesure} parties par ligne, decks prêtés croisés.\n`,
);
entete(['Joueurs', 'Victoires du premier', 'Victoires du second', 'Nulles']);
const profils: [string, Strategie][] = [
  ['Profil débutant', choisirActionDebutant],
  ...NIVEAUX_BOT.map((n): [string, Strategie] => [n.nom, n.strategie]),
];
for (const [nom, strategie] of profils) {
  const r = croiser(strategie);
  ligne([
    nom,
    pourcent(r.victoiresPremier, r.parties),
    pourcent(r.victoiresSecond, r.parties),
    pourcent(r.nulles, r.parties),
  ]);
}

/** Victoires de A : en tout, quand il commence, quand il joue en second. */
const victoiresDeA = (r: ResultatSimulation) => [
  pourcent(r.victoiresA, r.parties),
  pourcent(r.victoiresAPremier, r.partiesAPremier),
  pourcent(r.victoiresA - r.victoiresAPremier, r.parties - r.partiesAPremier),
];

// Chaque niveau contre deux joueurs de référence (US-064) : un débutant, et un joueur du niveau de Batch de nuit.
console.log(
  `\nVictoires d'un joueur contre chaque niveau : ${parMesure} parties par mesure, decks prêtés croisés.\n`,
);
entete([
  'Niveau du bot',
  'Débutant',
  'en commençant',
  'en second',
  'Joueur « Batch de nuit »',
  'en commençant',
  'en second',
]);
for (const niveau of NIVEAUX_BOT) {
  ligne([
    niveau.nom,
    ...victoiresDeA(croiser(choisirActionDebutant, niveau.strategie)),
    ...victoiresDeA(croiser(choisirActionBatchDeNuit, niveau.strategie)),
  ]);
}

// Le conseil (US-066) : un joueur qui le suit toujours doit battre Stagiaire 85 % du temps, Batch de nuit 45 %.
console.log(`
Joueur qui suit toujours le conseil : ${parMesure} parties par mesure, decks prêtés croisés.
`);
entete(['Niveau du bot', 'Victoires', 'en commençant', 'en second']);
const suivreLeConseil: Strategie = (vue) => conseiller(vue)?.action ?? { type: 'finirTour' };
for (const niveau of NIVEAUX_BOT.slice(0, 2)) {
  ligne([niveau.nom, ...victoiresDeA(croiser(suivreLeConseil, niveau.strategie))]);
}
