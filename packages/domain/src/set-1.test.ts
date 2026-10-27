import { describe, expect, it } from 'vitest';
import { detaillerCapacites, FAMILLES, LONGUEUR_MAX_AUTEUR } from './carte.ts';
import { RARETES } from './rarete.ts';
import { SET_1, trouverCarte } from './set-1.ts';

const compter = <T extends string>(valeurs: readonly T[]) =>
  Object.fromEntries(
    [...new Set(valeurs)].map((v) => [v, valeurs.filter((x) => x === v).length]),
  ) as Record<T, number>;

describe('set 1', () => {
  it('numérote les 74 cartes de 1 à 74, sans trou ni doublon (72 à 74 : extension d’US-077)', () => {
    expect(SET_1.map((carte) => carte.numero)).toEqual(Array.from({ length: 74 }, (_, i) => i + 1));
  });

  it('ne donne jamais deux fois le même nom', () => {
    expect(new Set(SET_1.map((carte) => carte.nom)).size).toBe(SET_1.length);
  });

  it('compte 4 légendaires, 7 épiques, 27 rares et 36 communes', () => {
    expect(compter(SET_1.map((carte) => carte.rarete))).toEqual({
      legendaire: 4,
      epique: 7,
      rare: 27,
      commune: 36,
    });
  });

  it('n’utilise que des familles et des raretés connues, avec un coût entre 0 et 10', () => {
    for (const carte of SET_1) {
      expect(FAMILLES).toContain(carte.famille);
      expect(RARETES).toContain(carte.rarete);
      expect(carte.cout).toBeGreaterThanOrEqual(0);
      expect(carte.cout).toBeLessThanOrEqual(10);
    }
  });

  it('fait de toute évolution l’héritière d’un composant existant', () => {
    const evolutions = SET_1.filter((carte) => carte.type === 'evolution');
    expect(evolutions.map((e) => [e.nom, trouverCarte(e.origine)?.nom])).toEqual([
      ['webMethods.io', 'webMethods Integration Server 10.15'],
      ['Solace Agent Mesh', 'Solace Event Mesh'],
      ['Apigee AI Gateway', 'Apigee API Gateway'],
    ]);
    for (const evolution of evolutions)
      expect(trouverCarte(evolution.origine)?.type).toBe('composant');
  });

  it('donne une attaque et des PV aux seuls composants et évolutions', () => {
    for (const carte of SET_1) {
      const avecStats = carte.type === 'composant' || carte.type === 'evolution';
      expect('attaque' in carte, carte.nom).toBe(avecStats);
      expect('pv' in carte, carte.nom).toBe(avecStats);
      if (avecStats) expect(carte.pv, carte.nom).toBeGreaterThan(0);
    }
  });

  it('range les incidents dans le Bestiaire et ne garde que les sorts et incidents sans capacité', () => {
    for (const carte of SET_1) {
      if (carte.type === 'incident') expect(carte.famille).toBe('bestiaire');
      if (carte.type === 'sort' || carte.type === 'incident') {
        expect(carte.capacites, carte.nom).toEqual([]);
        expect(carte.effet, carte.nom).toBeTruthy();
      }
    }
  });

  it('décrit chaque carte en vrai', () => {
    for (const carte of SET_1) expect(carte.enVrai.length, carte.nom).toBeGreaterThan(5);
  });

  it('ne crédite que les cartes de la communauté, d’un nom affiché court et sans blanc superflu (US-030)', () => {
    // Les 74 premières cartes viennent du porteur du projet : elles n’ont pas d’auteur.
    expect(SET_1.filter((carte) => carte.numero <= 74 && carte.auteur !== undefined)).toEqual([]);
    for (const { nom, auteur } of SET_1) {
      if (auteur === undefined) continue;
      expect(auteur, nom).toBe(auteur.trim());
      expect(auteur.length, nom).toBeGreaterThan(0);
      expect(auteur.length, nom).toBeLessThanOrEqual(LONGUEUR_MAX_AUTEUR);
    }
  });
});

describe('detaillerCapacites', () => {
  it('donne le nom et la description de chaque capacité, avec la valeur de Connecteur', () => {
    const webMethodsIo = trouverCarte(26);
    expect(webMethodsIo && detaillerCapacites(webMethodsIo)).toEqual([
      { id: 'hub', nom: 'Hub', description: 'Vos autres composants ont +1 attaque.' },
      {
        id: 'connecteur',
        nom: 'Connecteur (2)',
        valeur: 2,
        description: 'Quand la carte est posée, piochez autant de cartes que la valeur indiquée.',
      },
    ]);
  });

  it('renvoie une liste vide pour une carte sans capacité', () => {
    const csv = trouverCarte(4);
    expect(csv && detaillerCapacites(csv)).toEqual([]);
  });
});

describe('trouverCarte', () => {
  it('ne trouve rien pour un numéro inconnu', () => {
    expect(trouverCarte(0)).toBeUndefined();
    expect(trouverCarte(SET_1.length + 1)).toBeUndefined();
  });
});
