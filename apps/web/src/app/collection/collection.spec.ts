import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import type { Rarete } from '../libelles';
import { CollectionEcran } from './collection';

const carte = (numero: number, rarete: Rarete): Carte => ({
  numero,
  nom: `Carte ${numero}`,
  famille: numero % 2 ? 'fichiers' : 'api',
  type: 'composant',
  rarete,
  cout: 1,
  attaque: 1,
  pv: 1,
  capacites: [],
  enVrai: '',
});
const CATALOGUE = [
  carte(1, 'commune'),
  carte(2, 'commune'),
  carte(3, 'rare'),
  carte(4, 'epique'),
  carte(5, 'legendaire'),
];

describe('Collection', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CollectionEcran],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
  });

  async function afficher() {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
    const fixture = TestBed.createComponent(CollectionEcran);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    http.expectOne('/api/v1/moi/collection').flush({
      cartes: [
        { numero: 1, exemplaires: 3 },
        { numero: 3, exemplaires: 1 },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  const bouton = (page: HTMLElement, texte: string) =>
    [...page.querySelectorAll('button')].find((b) => b.textContent?.includes(texte));

  const choisir = (page: HTMLElement, id: string, valeur: string) => {
    const liste = page.querySelector<HTMLSelectElement>(`#${id}`);
    if (!liste) throw new Error(`liste ${id} absente`);
    liste.value = valeur;
    liste.dispatchEvent(new Event('change'));
  };

  it('affiche la progression du set et par rareté', async () => {
    const { page } = await afficher();
    expect(page.querySelector('#titre-progression')?.textContent).toContain('Set 1 : 2 / 5 cartes');
    expect(page.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('2');
    const raretes = [...page.querySelectorAll('section li')].map((li) =>
      [...li.querySelectorAll('span')].map((s) => s.textContent?.trim()).join(' '),
    );
    expect(raretes).toEqual([
      '● Commune 1 / 2',
      '◆ Rare 1 / 1',
      '▲ Épique 0 / 1',
      '★ Légendaire 0 / 1',
    ]);
  });

  it('montre les doubles, garde les manquantes visibles et grisées', async () => {
    const { page } = await afficher();
    const cartes = [...page.querySelectorAll('li:has(> hip-vignette-carte)')];
    expect(cartes).toHaveLength(5);
    expect(cartes[0]?.textContent).toContain('× 3 exemplaires');
    expect(cartes[1]?.textContent).toContain('Manquante');
    expect(cartes[1]?.querySelector('hip-vignette-carte')?.classList).toContain('grayscale');
    expect(cartes[0]?.querySelector('hip-vignette-carte')?.classList).not.toContain('grayscale');
  });

  it('dit pourquoi la collection n’a pas pu être lue, et la relit quand on réessaie (US-055)', async () => {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
    const fixture = TestBed.createComponent(CollectionEcran);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    http
      .expectOne('/api/v1/moi/collection')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'La collection n’a pas pu être chargée. Serveur injoignable pour le moment',
    );
    expect(page.textContent).not.toContain('Chargement de la collection');

    bouton(page, 'Réessayer')?.click();
    http.expectOne('/api/v1/moi/collection').flush({ cartes: [{ numero: 2, exemplaires: 1 }] });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('#titre-progression')?.textContent).toContain('Set 1 : 1 / 5 cartes');
  });

  it('avec un compte gardé mais non vérifié, n’invite jamais à en créer un (US-055)', async () => {
    localStorage.setItem('hipmaster.jeton', 'jeton-garde');
    TestBed.inject(CompteService).echec.set(new HttpErrorResponse({ status: 503 }));
    const fixture = TestBed.createComponent(CollectionEcran);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/cartes').flush(CATALOGUE);
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Votre session n’a pas pu être vérifiée, mais votre compte reste gardé par ce navigateur.',
    );
    expect(page.querySelector('main a[href="/compte"]')).toBeNull();
    expect(bouton(page, 'Réessayer')).toBeTruthy();
  });

  it('filtre les cartes possédées ou manquantes, en plus de la famille et de la rareté', async () => {
    const { fixture, page } = await afficher();
    const statut = () => page.querySelector('[role="status"]')?.textContent?.trim();

    choisir(page, 'filtre-possession', 'possedees');
    fixture.detectChanges();
    expect(statut()).toBe('2 cartes affichées');

    choisir(page, 'filtre-possession', 'manquantes');
    fixture.detectChanges();
    expect(statut()).toBe('3 cartes affichées');

    choisir(page, 'filtre-famille', 'fichiers');
    fixture.detectChanges();
    expect(statut()).toBe('1 carte affichée');

    choisir(page, 'filtre-rarete', 'commune');
    fixture.detectChanges();
    expect(statut()).toBe('Aucune carte ne correspond à ces filtres.');
  });
});
