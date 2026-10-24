import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { intercepteurCatalogue } from './catalogue';

describe('intercepteurCatalogue (US-057)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([intercepteurCatalogue])),
        provideHttpClientTesting(),
      ],
    });
  });

  const lire = (url: string) => firstValueFrom(TestBed.inject(HttpClient).get(url));

  it('ne demande le catalogue qu’une fois, même à plusieurs écrans en même temps', async () => {
    const http = TestBed.inject(HttpTestingController);
    const premiere = lire('/api/v1/cartes');
    const seconde = lire('/api/v1/cartes');
    http.expectOne('/api/v1/cartes').flush([{ numero: 1 }]);
    expect(await premiere).toEqual([{ numero: 1 }]);
    expect(await seconde).toEqual([{ numero: 1 }]);
    // Un écran ouvert plus tard reçoit la même réponse, sans requête.
    expect(await lire('/api/v1/cartes')).toEqual([{ numero: 1 }]);
    for (const url of ['/api/v1/cartes/7', '/api/v1/decks', '/api/v1/niveaux', '/api/v1/raretes']) {
      const reponse = lire(url);
      http.expectOne(url).flush({ url });
      expect(await reponse).toEqual({ url });
      expect(await lire(url)).toEqual({ url });
    }
    http.verify();
  });

  it('retente une lecture du catalogue qui a échoué', async () => {
    const http = TestBed.inject(HttpTestingController);
    const echec = lire('/api/v1/decks');
    http.expectOne('/api/v1/decks').flush(null, { status: 503, statusText: 'Indisponible' });
    await expect(echec).rejects.toMatchObject({ status: 503 });
    const nouvelle = lire('/api/v1/decks');
    http.expectOne('/api/v1/decks').flush([]);
    expect(await nouvelle).toEqual([]);
  });

  it('ne garde jamais les données d’un joueur', async () => {
    const http = TestBed.inject(HttpTestingController);
    for (let fois = 0; fois < 2; fois++) {
      const reponse = lire('/api/v1/moi/duels');
      http.expectOne('/api/v1/moi/duels').flush({ duels: [fois] });
      // Chaque lecture reçoit la réponse du serveur, jamais une réponse gardée.
      expect(await reponse).toEqual({ duels: [fois] });
    }
    http.verify();
  });
});
