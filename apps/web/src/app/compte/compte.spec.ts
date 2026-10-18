import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CompteEcran } from './compte';
import { CompteService, intercepteurJeton } from './compte.service';

const JOUEUR = { id: '00000000-0000-4000-8000-000000000001', pseudo: 'Ada' };

describe('Compte', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CompteEcran],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
  });

  async function afficher() {
    const fixture = TestBed.createComponent(CompteEcran);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  const saisir = (page: HTMLElement, id: string, valeur: string) => {
    const champ = page.querySelector<HTMLInputElement>(`#${id}`);
    if (!champ) throw new Error(`champ ${id} absent`);
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
  };

  it('crée un compte, garde le jeton et montre le code de récupération une seule fois', async () => {
    const { fixture, page } = await afficher();
    saisir(page, 'pseudo', ' Ada ');
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    const requete = TestBed.inject(HttpTestingController).expectOne('/api/v1/joueurs');
    expect(requete.request.body).toEqual({ pseudo: 'Ada' });
    requete.flush({ joueur: JOUEUR, jeton: 'jeton-1', codeRecuperation: 'ABCD-EFGH-JKLM' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('ABCD-EFGH-JKLM');
    expect(page.textContent).toContain('Connecté en tant que Ada');
    expect(localStorage.getItem('hipmaster.jeton')).toBe('jeton-1');

    [...page.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('C’est noté'))
      ?.click();
    fixture.detectChanges();
    expect(page.textContent).not.toContain('ABCD-EFGH-JKLM');
  });

  it('retrouve un compte avec son code, et explique un code inconnu', async () => {
    const { fixture, page } = await afficher();
    const http = TestBed.inject(HttpTestingController);
    saisir(page, 'code', 'zzzz-zzzz-zzzz');
    page.querySelectorAll<HTMLFormElement>('form')[1]?.requestSubmit();
    http
      .expectOne('/api/v1/sessions')
      .flush(
        { title: 'Code de récupération inconnu', status: 401 },
        { status: 401, statusText: 'x' },
      );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Code de récupération inconnu',
    );

    page.querySelectorAll<HTMLFormElement>('form')[1]?.requestSubmit();
    http.expectOne('/api/v1/sessions').flush({ joueur: JOUEUR, jeton: 'jeton-2' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Connecté en tant que Ada');
  });

  it('envoie le jeton à l’API, et l’oublie si l’API ne reconnaît plus la session', async () => {
    localStorage.setItem('hipmaster.jeton', 'jeton-ancien');
    const service = TestBed.inject(CompteService);
    const http = TestBed.inject(HttpTestingController);
    const chargement = service.charger();
    const moi = http.expectOne('/api/v1/moi');
    expect(moi.request.headers.get('Authorization')).toBe('Bearer jeton-ancien');
    moi.flush({ title: 'Compte requis', status: 401 }, { status: 401, statusText: 'x' });
    await chargement;
    expect(service.joueur()).toBeNull();
    expect(localStorage.getItem('hipmaster.jeton')).toBeNull();

    void firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/cartes'));
    expect(http.expectOne('/api/v1/cartes').request.headers.has('Authorization')).toBe(false);
  });
});
