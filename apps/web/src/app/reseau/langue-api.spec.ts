import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { intercepteurLangue } from './langue-api';

describe('intercepteurLangue (US-081)', () => {
  it('en français, la langue de référence, les appels de l’API gardent leur adresse', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([intercepteurLangue])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(HttpClient).get('/api/v1/cartes').subscribe();
    const requete = TestBed.inject(HttpTestingController).expectOne('/api/v1/cartes');
    expect(requete.request.params.has('langue')).toBe(false);
    requete.flush([]);
  });
});
