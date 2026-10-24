import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import { TitreAvecDuels } from '../titre';
import { etatDuel, MesDuels } from './mes-duels';
import type { ResumeDuel } from './mes-duels.service';

const il = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const dans = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();
const DUELS: ResumeDuel[] = [
  {
    id: 'a',
    statut: 'en-cours',
    adversaire: { pseudo: 'Bob' },
    monTour: true,
    tour: 5,
    resultat: null,
    raison: null,
    majLe: il(3),
    echeance: dans(49 * 60),
  },
  {
    id: 'b',
    statut: 'en-cours',
    adversaire: { pseudo: 'Eve' },
    monTour: false,
    tour: 2,
    resultat: null,
    raison: null,
    majLe: il(120),
    echeance: dans(70 * 60),
  },
  {
    id: 'c',
    statut: 'attente',
    adversaire: null,
    monTour: false,
    tour: null,
    resultat: null,
    raison: null,
    majLe: il(30),
    echeance: null,
  },
  {
    id: 'd',
    statut: 'termine',
    adversaire: { pseudo: 'Bob' },
    monTour: false,
    tour: 20,
    resultat: 'victoire',
    raison: 'forfait',
    majLe: il(3000),
    echeance: null,
  },
];

describe('Mes duels', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MesDuels],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'duels', component: MesDuels, title: 'Mes duels — HIPMaster' }]),
        { provide: TitleStrategy, useClass: TitreAvecDuels },
      ],
    });
  });

  async function afficher() {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
    const fixture = TestBed.createComponent(MesDuels);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/moi/duels')
      .flush({ aMonTour: 1, duels: DUELS });
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('range les duels : à mon tour, au tour de l’adversaire, en attente, terminés', async () => {
    const { page } = await afficher();
    const titres = [...page.querySelectorAll('h2')].map((h) => h.textContent?.trim());
    expect(titres).toEqual([
      'À vous de jouer (1)',
      'Au tour de l’adversaire (1)',
      'Défis en attente d’un adversaire (1)',
      'Terminés (1)',
    ]);
    const liens = [...page.querySelectorAll<HTMLAnchorElement>('li a')].map((a) =>
      a.textContent?.replaceAll(/\s+/g, ' ').trim(),
    );
    // L'initiale de l'adversaire, puis le duel, puis son état en pastille (US-068).
    expect(liens).toEqual([
      'B Contre Bob Tour 5 · reste 2 j 1 h · dernier coup il y a 3 min À vous',
      'E Contre Eve Tour 2 · reste 2 j 22 h · dernier coup il y a 2 h Son tour',
      '? Défi non relevé lancé il y a 30 min En attente',
      'B Contre Bob Par forfait · dernier coup il y a 2 j Victoire',
    ]);
    expect(page.querySelector('li a')?.getAttribute('href')).toBe('/duels/a');
  });

  it('résume l’état de chaque duel en une pastille, un mot doublé d’une couleur (US-068)', () => {
    const [aMoi, aLui, enAttente, gagne] = DUELS as [
      ResumeDuel,
      ResumeDuel,
      ResumeDuel,
      ResumeDuel,
    ];
    expect(etatDuel(aMoi)).toEqual({ libelle: 'À vous', classe: 'statut-a-jouer' });
    expect(etatDuel(aLui)).toEqual({ libelle: 'Son tour', classe: 'statut-attente' });
    expect(etatDuel(enAttente)).toEqual({ libelle: 'En attente', classe: 'statut-attente' });
    expect(etatDuel(gagne)).toEqual({ libelle: 'Victoire', classe: 'statut-victoire' });
    expect(etatDuel({ ...gagne, resultat: 'defaite' }).classe).toBe('statut-defaite');
    expect(etatDuel({ ...gagne, resultat: 'nulle' })).toEqual({
      libelle: 'Partie nulle',
      classe: 'statut-attente',
    });
  });

  it('si la liste n’a pas pu être lue, dit pourquoi et la relit quand on réessaie (US-055)', async () => {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
    const fixture = TestBed.createComponent(MesDuels);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/moi/duels').flush(null, {
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'Retry-After': '20' },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Vos duels n’ont pas pu être chargés. Trop de demandes en peu de temps : patientez 20 s',
    );
    expect(page.textContent).not.toContain('Chargement de vos duels');

    [...page.querySelectorAll('button')].find((b) => b.textContent?.includes('Réessayer'))?.click();
    http.expectOne('/api/v1/moi/duels').flush({ aMonTour: 1, duels: DUELS });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('h2')?.textContent).toContain('À vous de jouer (1)');
  });

  it('préfixe le titre de l’onglet par le nombre de duels qui attendent le joueur', async () => {
    await afficher();
    await TestBed.inject(Router).navigateByUrl('/duels');
    TestBed.tick();
    expect(TestBed.inject(Title).getTitle()).toBe('(1) Mes duels — HIPMaster');
  });
});
