import { TestBed } from '@angular/core/testing';
import { ChoixLangue } from './choix-langue';
import { adresseDansLaLangue, LANGUE } from './langue';

function ouvrir(chemin: string) {
  const fixture = TestBed.createComponent(ChoixLangue);
  fixture.componentRef.setInput('chemin', chemin);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ChoixLangue (US-079)', () => {
  beforeEach(() => localStorage.clear());

  it('sans build localisé, la page est en français, la langue de référence', () => {
    expect(LANGUE).toBe('fr');
  });

  it('signale la langue de la page et mène à la même page dans l’autre, chaque nom dans sa langue', () => {
    const page = ouvrir('/collection?vue=1');
    expect(page.querySelector('nav')?.getAttribute('aria-label')).toBe('Langue');
    const courante = page.querySelector('[aria-current="true"]');
    expect(courante?.getAttribute('lang')).toBe('fr');
    expect(courante?.textContent).toContain('Français');
    const liens = page.querySelectorAll('a');
    expect(liens).toHaveLength(1);
    expect(liens[0]?.getAttribute('href')).toBe('/en/collection?vue=1');
    expect(liens[0]?.getAttribute('lang')).toBe('en');
    expect(liens[0]?.getAttribute('hreflang')).toBe('en');
    expect(liens[0]?.textContent).toContain('English');
  });

  it('retient le choix du joueur, que la page d’accueil du site relira', () => {
    const lien = ouvrir('/').querySelector('a');
    lien?.addEventListener('click', (evenement) => evenement.preventDefault());
    lien?.click();
    expect(localStorage.getItem('hipmaster.langue')).toBe('en');
  });

  it('préfixe le chemin de l’application par la langue', () => {
    expect(adresseDansLaLangue('en', '/')).toBe('/en/');
    expect(adresseDansLaLangue('fr', '/duels/abc')).toBe('/fr/duels/abc');
    expect(adresseDansLaLangue('en', 'cartes')).toBe('/en/cartes');
  });
});
