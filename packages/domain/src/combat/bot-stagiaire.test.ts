import { describe, expect, it } from 'vitest';
import { jouer, scenario, type Scenario } from './aide-tests.ts';
import { choisirActionBatchDeNuit } from './bot.ts';
import { choisirActionDebutant, choisirActionStagiaire } from './bot-stagiaire.ts';
import { DECKS_PRETES } from './decks.ts';
import { simulerCroise, type Strategie } from './simulation.ts';
import { vueDe } from './vue.ts';

const choix = (strategie: Strategie, s: Scenario) => strategie(vueDe(scenario(s), 'j1'));

describe('profil débutant (US-064)', () => {
  const debutant = (s: Scenario) => choix(choisirActionDebutant, s);

  it('pose la carte la plus chère qu’il peut payer, évolution comprise', () => {
    expect(debutant({ main: [4, 17, 41], debit: 3 })).toEqual({ type: 'poser', carte: 'm2' });
    expect(debutant({ main: [26, 22], plateau: [9], debit: 5 })).toEqual({
      type: 'evoluer',
      carte: 'm1',
      origine: 'a1',
    });
  });

  it('attaque le SI dès qu’il peut, même quand il pourrait détruire un composant', () => {
    expect(debutant({ plateau: [17], plateauAdverse: [16] })).toEqual({
      type: 'attaquer',
      attaquant: 'a1',
      cible: 'si',
    });
  });

  it('attaque la Garde qui protège le SI, même à perte', () => {
    expect(debutant({ plateau: [4], plateauAdverse: [18] })).toEqual({
      type: 'attaquer',
      attaquant: 'a1',
      cible: 'b1',
    });
  });

  it('ne joue ni sort ni incident, et ne décommissionne jamais', () => {
    expect(debutant({ main: [55, 21], plateauAdverse: [16], debit: 3 })).toEqual({
      type: 'finirTour',
    });
    expect(debutant({ main: [15, 22], debit: 0 })).toEqual({ type: 'finirTour' });
  });
});

describe('bot Stagiaire (US-064)', () => {
  const stagiaire = (s: Scenario) => choix(choisirActionStagiaire, s);

  it('ne pose qu’une carte par tour, la plus chère qu’il peut payer', () => {
    const etat = scenario({ main: [4, 17, 22], debit: 10 });
    const pose = choisirActionStagiaire(vueDe(etat, 'j1'));
    expect(pose).toEqual({ type: 'poser', carte: 'm2' });
    // Il lui reste 7 Débit et deux cartes jouables : il s'arrête là.
    expect(choisirActionStagiaire(vueDe(jouer(etat, pose), 'j1'))).toEqual({ type: 'finirTour' });
  });

  it('attaque le SI dès qu’il peut, sinon la Garde, sans sort ni décommissionnement', () => {
    expect(stagiaire({ plateau: [17], plateauAdverse: [16] })).toEqual({
      type: 'attaquer',
      attaquant: 'a1',
      cible: 'si',
    });
    expect(stagiaire({ plateau: [4], plateauAdverse: [18] })).toEqual({
      type: 'attaquer',
      attaquant: 'a1',
      cible: 'b1',
    });
    expect(stagiaire({ main: [55, 21], plateauAdverse: [16], debit: 3 })).toEqual({
      type: 'finirTour',
    });
    expect(stagiaire({ main: [15, 22], debit: 0 })).toEqual({ type: 'finirTour' });
  });

  it('est nettement plus facile que Batch de nuit', () => {
    // 18 parties sur les 9 paires de decks prêtés, graines fixes : le résultat ne varie pas d'un lancement à l'autre.
    const decks = DECKS_PRETES.map((d) => d.cartes);
    const r = simulerCroise(decks, 2, 1, choisirActionBatchDeNuit, choisirActionStagiaire);
    expect(r.parties).toBe(18);
    expect(r.victoiresA).toBeGreaterThanOrEqual(14);
  });
});
