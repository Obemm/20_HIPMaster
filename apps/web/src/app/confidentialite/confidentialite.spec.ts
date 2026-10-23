import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CONSERVATIONS, ConfidentialiteEcran } from './confidentialite';

describe('À propos et confidentialité', () => {
  async function afficher() {
    TestBed.configureTestingModule({
      imports: [ConfidentialiteEcran],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(ConfidentialiteEcran);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('dit qui héberge le jeu, ce qu’il garde, et qu’aucun traceur n’est utilisé (US-053)', async () => {
    const page = await afficher();
    for (const texte of [
      'Firebase Hosting',
      'Cloud Run',
      'Neon',
      'Francfort',
      'adresse IP',
      'aucun bandeau de consentement',
      'aucun outil de mesure d’audience',
    ]) {
      expect(page.textContent).toContain(texte);
    }
    expect(page.querySelector('a[href="/compte"]')?.textContent).toContain('Mon compte');
  });

  it('donne chaque durée de conservation, et marque celles qui ne sont pas encore appliquées', async () => {
    const page = await afficher();
    const lignes = [...page.querySelectorAll('dl > div')].map((l) => l.textContent ?? '');
    expect(lignes).toHaveLength(CONSERVATIONS.length);
    for (const [i, c] of CONSERVATIONS.entries()) {
      expect(lignes[i]).toContain(c.duree);
      expect(lignes[i]?.includes('(bientôt)')).toBe(c.aVenir === true);
    }
    expect(lignes.join(' ')).toContain('90 jours');
    expect(lignes.join(' ')).toContain('12 mois');
  });
});
