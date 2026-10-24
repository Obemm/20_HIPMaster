import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import { NouveauDefi } from './nouveau-defi';

const DECKS = [{ id: 'hybride', nom: 'Hybride', description: 'Un peu de tout', cartes: [] }];

describe('NouveauDefi', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NouveauDefi],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
  });

  async function choisir(hasard: boolean | undefined) {
    const fixture = TestBed.createComponent(NouveauDefi);
    fixture.componentRef.setInput('hasard', hasard);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/decks').flush(DECKS);
    // Le catalogue donne les cartes phares de chaque deck (US-068).
    http.expectOne('/api/v1/cartes').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    page.querySelector<HTMLButtonElement>('li button')?.click();
    return { fixture, http, page, naviguer };
  }

  it('défi par lien : crée un duel privé (route sans donnée « hasard »)', async () => {
    const { fixture, http, page, naviguer } = await choisir(undefined);
    expect(page.querySelector('h1')?.textContent).toContain('Défier un collègue');
    http.expectOne('/api/v1/duels').flush({ id: 'd1' });
    await fixture.whenStable();
    expect(naviguer).toHaveBeenCalledWith(['/duels', 'd1']);
  });

  it('adversaire au hasard : rejoint la file d’appariement', async () => {
    const { fixture, http, page, naviguer } = await choisir(true);
    expect(page.querySelector('h1')?.textContent).toContain('Adversaire au hasard');
    const requete = http.expectOne('/api/v1/duels/hasard');
    expect(requete.request.body).toEqual({ deck: 'hybride' });
    requete.flush({ id: 'd2' });
    await fixture.whenStable();
    expect(naviguer).toHaveBeenCalledWith(['/duels', 'd2']);
  });
});
