import type { Carte } from './carte';
import { contributeurs, estCarteCommunaute } from './communaute';

const carte = (numero: number, auteur?: string): Carte => ({
  numero,
  nom: `Carte ${numero}`,
  famille: 'api',
  type: 'composant',
  rarete: 'commune',
  cout: 1,
  attaque: 1,
  pv: 1,
  capacites: [],
  enVrai: 'Un texte.',
  ...(auteur === undefined ? {} : { auteur }),
});

describe('Cartes de la communauté (US-031)', () => {
  it('reconnaît une carte de la communauté à son auteur', () => {
    expect(estCarteCommunaute(carte(75, 'Camille D.'))).toBe(true);
    expect(estCarteCommunaute(carte(1))).toBe(false);
  });

  it('regroupe les cartes par auteur, auteurs par ordre alphabétique et cartes par numéro', () => {
    const resultat = contributeurs([
      carte(1),
      carte(78, 'Camille D.'),
      carte(76, 'Élodie M.'),
      carte(75, 'Camille D.'),
      carte(77, 'bastien R.'),
    ]);
    expect(resultat.map((c) => c.nom)).toEqual(['bastien R.', 'Camille D.', 'Élodie M.']);
    expect(resultat[1]?.cartes.map((c) => c.numero)).toEqual([75, 78]);
  });

  it('ne trouve aucun contributeur dans un catalogue sans auteur', () => {
    expect(contributeurs([carte(1), carte(2)])).toEqual([]);
  });
});
