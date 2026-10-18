import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import { TitreAvecDuels } from '../titre';
import { MesDuels } from './mes-duels';
import type { ResumeDuel } from './mes-duels.service';

const il = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const DUELS: ResumeDuel[] = [
  {
    id: 'a',
    statut: 'en-cours',
    adversaire: { pseudo: 'Bob' },
    monTour: true,
    tour: 5,
    resultat: null,
    majLe: il(3),
  },
  {
    id: 'b',
    statut: 'en-cours',
    adversaire: { pseudo: 'Eve' },
    monTour: false,
    tour: 2,
    resultat: null,
    majLe: il(120),
  },
  {
    id: 'c',
    statut: 'attente',
    adversaire: null,
    monTour: false,
    tour: null,
    resultat: null,
    majLe: il(30),
  },
  {
    id: 'd',
    statut: 'termine',
    adversaire: { pseudo: 'Bob' },
    monTour: false,
    tour: 20,
    resultat: 'victoire',
    majLe: il(3000),
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
    expect(liens).toEqual([
      'Contre Bob Tour 5 · dernier coup il y a 3 min',
      'Contre Eve Tour 2 · dernier coup il y a 2 h',
      'Défi non relevé lancé il y a 30 min',
      'Contre Bob Victoire · dernier coup il y a 2 j',
    ]);
    expect(page.querySelector('li a')?.getAttribute('href')).toBe('/duels/a');
  });

  it('préfixe le titre de l’onglet par le nombre de duels qui attendent le joueur', async () => {
    await afficher();
    await TestBed.inject(Router).navigateByUrl('/duels');
    TestBed.tick();
    expect(TestBed.inject(Title).getTitle()).toBe('(1) Mes duels — HIPMaster');
  });
});
