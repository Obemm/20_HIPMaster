import type { Carte, Famille } from '../cartes/carte';
import type { Rarete } from '../libelles';
import {
  avertissements,
  courbeCout,
  limiterACollection,
  messageProbleme,
  repartitionFamilles,
} from './analyse-deck';
import type { ReglesDeck } from './mes-decks.service';

const carte = (numero: number, cout: number, famille: Famille, rarete: Rarete = 'commune') =>
  ({ numero, nom: `Carte ${numero}`, cout, famille, rarete }) as Carte;
const CATALOGUE = new Map(
  [
    carte(1, 1, 'fichiers', 'legendaire'),
    carte(2, 2, 'api'),
    carte(3, 3, 'api'),
    carte(4, 7, 'ia'),
  ].map((c) => [c.numero, c]),
);
const REGLES: ReglesDeck = {
  taille: 20,
  exemplairesMax: 2,
  exemplairesMaxLegendaire: 1,
  decksMax: 5,
};

describe('analyse d’un deck (US-083)', () => {
  it('trace la courbe de coût, les cartes chères regroupées en « 6+ »', () => {
    expect(courbeCout([1, 2, 2, 4], CATALOGUE).map((c) => [c.libelle, c.nombre])).toEqual([
      ['1', 1],
      ['2', 2],
      ['3', 0],
      ['4', 0],
      ['5', 0],
      ['6+', 1],
    ]);
  });

  it('répartit les cartes par famille, la plus présente d’abord', () => {
    expect(
      repartitionFamilles([1, 2, 3, 4, 3], CATALOGUE).map((f) => [f.famille, f.nombre]),
    ).toEqual([
      ['api', 3],
      ['fichiers', 1],
      ['ia', 1],
    ]);
  });

  it('dit ce qui manque, ce qui dépasse et ce que la collection n’a pas', () => {
    const possedes = new Map([
      [1, 2],
      [2, 1],
    ]);
    expect(avertissements([1, 1, 2, 2], CATALOGUE, possedes, REGLES)).toEqual([
      'Il manque 16 cartes pour jouer.',
      'Carte 1 : 2 exemplaires, 1 au plus.',
      'Carte 2 : 2 dans le deck, 1 dans votre collection.',
    ]);
    const vingt = Array.from({ length: 20 }, (_, i) => (i < 10 ? 2 : 3));
    expect(avertissements(vingt, CATALOGUE, new Map(), REGLES)).toContain(
      'Carte 2 : 10 exemplaires, 2 au plus.',
    );
    expect(avertissements([...vingt, 3], CATALOGUE, new Map(), REGLES)[0]).toBe(
      'Trop de cartes : 20 au plus.',
    );
  });

  it('traduit les problèmes renvoyés par le serveur', () => {
    const nom = (n: number) => `Carte ${n}`;
    expect(messageProbleme({ code: 'non-possedee', numero: 2, nombre: 2, possedes: 0 }, nom)).toBe(
      'Carte 2 : 2 dans le deck, 0 dans votre collection.',
    );
    expect(messageProbleme({ code: 'taille', cartes: 21 }, nom)).toBe(
      'Le deck compte 21 cartes : c’est trop.',
    );
  });

  it('limite un deck prêté aux exemplaires de la collection', () => {
    expect(
      limiterACollection(
        [2, 2, 3, 1, 1],
        new Map([
          [2, 1],
          [1, 5],
        ]),
      ),
    ).toEqual([2, 1, 1]);
  });
});
