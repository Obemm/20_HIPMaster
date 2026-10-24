import { TestBed } from '@angular/core/testing';
import { ILLUSTRATIONS_CARTES, illustrationsDansLaLangue } from './illustrations';

describe('Textes alternatifs des illustrations (US-081)', () => {
  it('chaque langue du site a le texte alternatif de chaque carte illustrée', () => {
    const francais = illustrationsDansLaLangue('fr');
    const anglais = illustrationsDansLaLangue('en');
    expect(Object.keys(anglais)).toEqual(Object.keys(francais));
    expect(francais[1]).toContain('pélican');
    expect(anglais[1]).toContain('pelican');
  });

  it('sans build localisé, les vignettes lisent le français, la langue de référence', () => {
    expect(TestBed.inject(ILLUSTRATIONS_CARTES)).toBe(illustrationsDansLaLangue('fr'));
  });
});
