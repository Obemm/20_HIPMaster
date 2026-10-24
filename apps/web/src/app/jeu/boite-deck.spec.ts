import { TestBed } from '@angular/core/testing';
import type { Carte } from '../cartes/carte';
import { ILLUSTRATIONS_CARTES } from '../cartes/illustrations';
import type { Rarete } from '../libelles';
import { BoiteDeck, cartesPhares } from './boite-deck';
import type { Deck } from './modele';

const carte = (numero: number, rarete: Rarete, cout: number): Carte => ({
  numero,
  nom: `Carte ${numero}`,
  famille: 'api',
  type: 'composant',
  rarete,
  cout,
  capacites: [],
  enVrai: '',
});
const CATALOGUE = [
  carte(1, 'commune', 1),
  carte(2, 'rare', 2),
  carte(3, 'epique', 3),
  carte(4, 'legendaire', 6),
  carte(5, 'rare', 5),
];
const DECK: Deck = {
  id: 'moderne',
  nom: 'Moderne',
  description: 'API et EDA.',
  cartes: [1, 1, 2, 3, 5, 4],
};

describe('BoiteDeck', () => {
  it('choisit les trois cartes phares : les plus rares, puis les plus chères', () => {
    expect((cartesPhares(DECK, CATALOGUE) as Carte[]).map((c) => c.numero)).toEqual([4, 3, 5]);
  });

  it('sans le catalogue, prend les trois premières cartes distinctes du deck', () => {
    expect(cartesPhares(DECK, undefined)).toEqual([1, 2, 3]);
  });

  it('montre le nom, la description et les illustrations des cartes phares, décoratives', () => {
    TestBed.configureTestingModule({
      imports: [BoiteDeck],
      providers: [
        { provide: ILLUSTRATIONS_CARTES, useValue: { 4: 'Une forteresse', 3: 'Un moyeu' } },
      ],
    });
    const fixture = TestBed.createComponent(BoiteDeck);
    fixture.componentRef.setInput('deck', DECK);
    fixture.componentRef.setInput('catalogue', CATALOGUE);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h2')?.textContent).toBe('Moderne');
    expect(page.textContent).toContain('API et EDA.');
    const images = page.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect([...images].every((i) => i.getAttribute('alt') === '')).toBe(true);
    expect(page.querySelector('.mini-eventail')?.getAttribute('aria-hidden')).toBe('true');
    expect(page.querySelector('.mini-eventail > div')?.className).toBe('cadre-legendaire');
  });
});
