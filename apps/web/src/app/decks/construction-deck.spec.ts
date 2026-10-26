import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { Carte, Famille } from '../cartes/carte';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import type { Rarete } from '../libelles';
import { ConstructionDeck } from './construction-deck';
import type { MonDeck } from './mes-decks.service';

const carte = (numero: number, cout: number, famille: Famille, rarete: Rarete): Carte => ({
  numero,
  nom: `Carte ${numero}`,
  famille,
  type: 'composant',
  rarete,
  cout,
  attaque: 1,
  pv: 1,
  capacites: [],
  enVrai: '',
});
const CATALOGUE = [
  carte(1, 1, 'fichiers', 'legendaire'),
  carte(2, 2, 'api', 'commune'),
  carte(3, 3, 'api', 'rare'),
  carte(4, 4, 'ia', 'epique'),
];
const REGLES = { taille: 20, exemplairesMax: 2, exemplairesMaxLegendaire: 1, decksMax: 5 };

describe('Construction d’un deck (US-083)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ConstructionDeck],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'decks/:id', children: [] }]),
      ],
    });
  });

  async function afficher(id?: string, decks: MonDeck[] = []) {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
    const fixture = TestBed.createComponent(ConstructionDeck);
    if (id) fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    http.expectOne('/api/v1/moi/collection').flush({
      cartes: [
        { numero: 1, exemplaires: 3 },
        { numero: 2, exemplaires: 1 },
        { numero: 3, exemplaires: 4 },
      ],
    });
    http.expectOne('/api/v1/moi/decks').flush({ regles: REGLES, decks });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    return { fixture, page, http };
  }

  /** Un bouton par son texte complet (le signe « + » ou « − » est caché, le texte pour lecteur d'écran non). */
  const bouton = (page: HTMLElement, libelle: string) => {
    const trouve = [...page.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(libelle),
    );
    if (!trouve) throw new Error(`bouton « ${libelle} » absent`);
    return trouve;
  };
  const lignes = (page: HTMLElement) =>
    [...page.querySelectorAll('#titre-mes-cartes ~ ul > li')].map((li) =>
      li.textContent?.replace(/\s+/g, ' ').trim(),
    );

  it('ne propose que les cartes possédées, et ce que le deck peut en prendre', async () => {
    const { page } = await afficher();
    expect(lignes(page)).toEqual([
      expect.stringContaining('Carte 1'),
      expect.stringContaining('Carte 2'),
      expect.stringContaining('Carte 3'),
    ]);
    // Légendaire : 1 au plus ; Carte 2 : un seul exemplaire possédé ; Carte 3 : 2 au plus.
    expect(lignes(page).map((l) => l?.match(/Dans le deck : \d \/ \d/)?.[0])).toEqual([
      'Dans le deck : 0 / 1',
      'Dans le deck : 0 / 1',
      'Dans le deck : 0 / 2',
    ]);
    expect(page.textContent).toContain('Il manque 20 cartes pour jouer.');
  });

  it('ajoute et retire des cartes, avec la courbe, les familles et les règles à jour', async () => {
    const { fixture, page } = await afficher();
    bouton(page, 'Ajouter un exemplaire de Carte 1').click();
    bouton(page, 'Ajouter un exemplaire de Carte 3').click();
    bouton(page, 'Ajouter un exemplaire de Carte 3').click();
    fixture.detectChanges();

    expect(bouton(page, 'Ajouter un exemplaire de Carte 1').disabled).toBe(true);
    expect(bouton(page, 'Ajouter un exemplaire de Carte 3').disabled).toBe(true);
    expect(page.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('3');
    expect(page.textContent).toContain('Il manque 17 cartes pour jouer.');
    expect(page.textContent).toContain('Coût 3 : 2 cartes');
    expect(page.textContent).toMatch(/API\s*2/);

    bouton(page, 'Retirer un exemplaire de Carte 3').click();
    fixture.detectChanges();
    expect(page.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('2');
  });

  it('filtre les cartes par famille, rareté et coût', async () => {
    const { fixture, page } = await afficher();
    const choisir = (id: string, valeur: string) => {
      const liste = page.querySelector<HTMLSelectElement>(`#${id}`);
      if (!liste) throw new Error(`liste ${id} absente`);
      liste.value = valeur;
      liste.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    choisir('filtre-famille', 'api');
    expect(lignes(page)).toHaveLength(2);
    choisir('filtre-rarete', 'rare');
    expect(lignes(page)).toEqual([expect.stringContaining('Carte 3')]);
    choisir('filtre-rarete', '');
    choisir('filtre-cout', '2');
    expect(lignes(page)).toEqual([expect.stringContaining('Carte 2')]);
  });

  it('enregistre un nouveau deck, puis passe à son adresse', async () => {
    const { fixture, page, http } = await afficher();
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate');
    const nom = page.querySelector<HTMLInputElement>('#nom-deck');
    if (!nom) throw new Error('champ du nom absent');
    nom.value = 'Tout API';
    nom.dispatchEvent(new Event('input'));
    bouton(page, 'Ajouter un exemplaire de Carte 2').click();
    fixture.detectChanges();
    [...page.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Enregistrer'))
      ?.click();

    const requete = http.expectOne('/api/v1/moi/decks');
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual({ nom: 'Tout API', cartes: [2] });
    requete.flush({
      id: 'd1',
      nom: 'Tout API',
      cartes: [2],
      complet: false,
      liberees: 0,
      majLe: '2026-10-26T00:00:00Z',
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigation).toHaveBeenCalledWith(['/decks', 'd1'], { replaceUrl: true });
    expect(page.textContent).toContain('Deck « Tout API » enregistré, encore incomplet.');
  });

  it('dit pourquoi le serveur refuse un deck, dans la langue du joueur', async () => {
    const deck: MonDeck = {
      id: 'd1',
      nom: 'Ancien',
      cartes: [3, 3],
      complet: false,
      liberees: 1,
      majLe: '2026-10-26T00:00:00Z',
    };
    const { fixture, page, http } = await afficher('d1', [deck]);
    expect(page.querySelector<HTMLInputElement>('#nom-deck')?.value).toBe('Ancien');
    [...page.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Enregistrer'))
      ?.click();
    const requete = http.expectOne('/api/v1/moi/decks/d1');
    expect(requete.request.method).toBe('PUT');
    requete.flush(
      {
        code: 'deck-carte-non-possedee',
        problemes: [{ code: 'non-possedee', numero: 3, nombre: 2, possedes: 1 }],
      },
      { status: 422, statusText: 'Unprocessable Content' },
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Carte 3 : 2 dans le deck, 1 dans votre collection.',
    );
    // La collection est relue : elle a pu changer.
    http.expectOne('/api/v1/moi/collection').flush({ cartes: [] });
  });

  it('annonce un deck qui n’existe pas ou plus', async () => {
    const { page } = await afficher('inconnu');
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Ce deck n’existe pas ou plus.',
    );
  });
});
