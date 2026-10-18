import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { ChoixDeck } from './choix-deck';
import type { Partie, Vue } from './modele';
import { PartieEcran } from './partie';

const GARDE = {
  id: 'garde',
  nom: 'Garde',
  description: 'Doit être attaqué avant vos autres composants et votre SI.',
};

const CATALOGUE: Carte[] = [
  {
    numero: 55,
    nom: 'Content-Based Router',
    famille: 'patterns',
    type: 'sort',
    rarete: 'commune',
    cout: 1,
    capacites: [],
    effet: 'Infligez 2 dégâts au composant adverse de votre choix.',
    enVrai: 'Router un message selon son contenu.',
  },
  {
    numero: 13,
    nom: 'Adaptateur SAP',
    famille: 'esb',
    type: 'composant',
    rarete: 'rare',
    cout: 4,
    attaque: 3,
    pv: 5,
    capacites: [GARDE],
    enVrai: 'Le passage obligé vers l’ERP.',
  },
  {
    numero: 22,
    nom: 'API REST',
    famille: 'api',
    type: 'composant',
    rarete: 'commune',
    cout: 2,
    attaque: 3,
    pv: 2,
    capacites: [],
    enVrai: 'Des ressources et des verbes HTTP.',
  },
  {
    numero: 17,
    nom: 'SOAP / WSDL',
    famille: 'esb',
    type: 'composant',
    rarete: 'commune',
    cout: 3,
    attaque: 3,
    pv: 4,
    capacites: [],
    enVrai: 'Le service web d’avant REST.',
  },
];

function vue(modifs: Partial<Vue> = {}): Vue {
  const camp = { sla: 20, debit: 3, tours: 2, plateau: [], defausse: [], pioche: 14 };
  return {
    joueur: 'j1',
    moi: { ...camp, main: [{ id: 'j1-01', numero: 22 }], aDecommissionne: false },
    adversaire: {
      ...camp,
      main: 4,
      plateau: [
        { id: 'j2-05', numero: 17, pv: 4, attaque: 3, poseAuTour: 1, aAttaqueCeTour: false },
      ],
    },
    actif: 'j1',
    tour: 3,
    issue: null,
    actions: [
      { type: 'poser', carte: 'j1-01' },
      { type: 'decommissionner', carte: 'j1-01' },
      { type: 'finirTour' },
    ],
    ...modifs,
  };
}

const partie = (v: Vue, evenements: Partie['evenements'] = []): Partie => ({
  id: 'p1',
  deck: 'moderne',
  deckAdversaire: 'heritage',
  vue: v,
  evenements,
});

async function ouvrir(v: Vue = vue()) {
  const fixture = TestBed.createComponent(PartieEcran);
  fixture.componentRef.setInput('id', 'p1');
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  http.expectOne('/api/v1/cartes').flush(CATALOGUE);
  http
    .expectOne('/api/v1/parties/p1')
    .flush(partie(v, [{ type: 'pose', joueur: 'j2', carte: { id: 'j2-05', numero: 17 } }]));
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, http, page: fixture.nativeElement as HTMLElement };
}

const bouton = (page: HTMLElement, texte: string) =>
  [...page.querySelectorAll('button')].find((b) =>
    (b.getAttribute('aria-label') ?? b.textContent ?? '').includes(texte),
  );

describe('PartieEcran', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PartieEcran],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('affiche les deux camps, la main et le journal avec les noms des cartes', async () => {
    const { page } = await ouvrir();
    expect(page.textContent).toContain('Tour 3 / 20');
    expect(page.textContent).toContain('SLA 20');
    expect(bouton(page, 'API REST')).toBeTruthy();
    expect(page.querySelector('[role="log"]')?.textContent).toContain('Le bot pose SOAP / WSDL.');
  });

  it('rappelle l’objectif, et ouvre « Comment jouer ? » au début de la partie seulement', async () => {
    const debut = vue();
    debut.moi.tours = 1;
    const { page } = await ouvrir(debut);
    expect(page.textContent).toContain('faire tomber le SLA du SI du bot à 0');
    expect(page.querySelector('details')?.open).toBe(true);
    expect(page.querySelector('details')?.textContent).toContain('Comment gagner ?');
  });

  it('replie « Comment jouer ? » une fois la partie avancée', async () => {
    const { page } = await ouvrir();
    expect(page.querySelector('details')?.open).toBe(false);
  });

  it('explique Garde quand le bot en a une : aide à l’attaque et capacités en jeu', async () => {
    const attaquant = {
      id: 'j1-02',
      numero: 22,
      pv: 2,
      attaque: 3,
      poseAuTour: 1,
      aAttaqueCeTour: false,
    };
    const v = vue({
      actions: [{ type: 'attaquer', attaquant: 'j1-02', cible: 'j2-06' }, { type: 'finirTour' }],
    });
    v.moi.plateau = [attaquant];
    v.adversaire.plateau = [
      { id: 'j2-06', numero: 13, pv: 5, attaque: 3, poseAuTour: 1, aAttaqueCeTour: false },
    ];
    const { fixture, page } = await ouvrir(v);
    const capacites = [...page.querySelectorAll('details')].find((d) =>
      d.querySelector('summary')?.textContent?.includes('Capacités en jeu'),
    );
    expect(capacites?.textContent).toContain('Garde');
    expect(capacites?.textContent).toContain('Doit être attaqué avant vos autres composants');
    bouton(page, 'peut attaquer')?.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('Le bot est protégé par Garde (Adaptateur SAP)');
  });

  it('propose les actions d’une carte choisie, et envoie celle qu’on clique', async () => {
    const { fixture, http, page } = await ouvrir();
    bouton(page, 'API REST')?.click();
    fixture.detectChanges();
    expect(bouton(page, 'Décommissionner (+1 Débit)')).toBeTruthy();
    bouton(page, 'Poser (2 Débit)')?.click();
    const requete = http.expectOne('/api/v1/parties/p1/actions');
    expect(requete.request.body).toEqual({ type: 'poser', carte: 'j1-01' });
    requete.flush(partie(vue()));
    await fixture.whenStable();
  });

  it('choisit un attaquant puis sa cible, seulement parmi les attaques proposées', async () => {
    const attaquant = {
      id: 'j1-02',
      numero: 22,
      pv: 2,
      attaque: 3,
      poseAuTour: 1,
      aAttaqueCeTour: false,
    };
    const v = vue({
      actions: [{ type: 'attaquer', attaquant: 'j1-02', cible: 'j2-05' }, { type: 'finirTour' }],
    });
    v.moi.plateau = [attaquant];
    const { fixture, http, page } = await ouvrir(v);
    const si = bouton(page, 'SI du bot');
    expect(si?.disabled).toBe(true);
    bouton(page, 'peut attaquer')?.click();
    fixture.detectChanges();
    expect(si?.disabled).toBe(true);
    bouton(page, 'SOAP / WSDL, attaque 3, PV 4 : attaquer')?.click();
    const requete = http.expectOne('/api/v1/parties/p1/actions');
    expect(requete.request.body).toEqual({ type: 'attaquer', attaquant: 'j1-02', cible: 'j2-05' });
    requete.flush(partie(vue()));
    await fixture.whenStable();
  });

  it('propose « Jouer sur … » pour un sort, et montre les statuts des composants', async () => {
    const v = vue({
      actions: [{ type: 'jouer', carte: 'j1-09', cibles: ['j2-05'] }, { type: 'finirTour' }],
    });
    v.moi.main = [{ id: 'j1-09', numero: 55 }];
    v.adversaire.plateau = [
      {
        id: 'j2-05',
        numero: 17,
        pv: 4,
        attaque: 3,
        poseAuTour: 1,
        aAttaqueCeTour: false,
        immobiliseJusquAuTour: 4,
        doublon: true,
      },
    ];
    const { fixture, http, page } = await ouvrir(v);
    expect(bouton(page, 'SOAP / WSDL')?.getAttribute('aria-label')).toContain(
      'Immobilisé, Doublon',
    );
    bouton(page, 'Content-Based Router')?.click();
    fixture.detectChanges();
    bouton(page, 'Jouer sur SOAP / WSDL (1 Débit)')?.click();
    const requete = http.expectOne('/api/v1/parties/p1/actions');
    expect(requete.request.body).toEqual({ type: 'jouer', carte: 'j1-09', cibles: ['j2-05'] });
    requete.flush(partie(vue()));
    await fixture.whenStable();
  });

  it('affiche le refus du serveur', async () => {
    const { fixture, http, page } = await ouvrir();
    bouton(page, 'Finir mon tour')?.click();
    http
      .expectOne('/api/v1/parties/p1/actions')
      .flush(
        { title: 'Action refusée', status: 422, detail: 'Pas assez de Débit.' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Pas assez de Débit.');
  });

  it('annonce la victoire et propose de rejouer', async () => {
    const v = vue({ issue: { gagnant: 'j1', raison: 'sla' }, actions: [] });
    const { page } = await ouvrir(v);
    expect(page.querySelector('#titre-fin')?.textContent).toContain('Victoire !');
    const liens = [...page.querySelectorAll('a[href="/jouer"]')].map((a) => a.textContent?.trim());
    expect(liens).toContain('Rejouer');
    expect(bouton(page, 'Finir mon tour')).toBeUndefined();
  });

  it('explique qu’une partie expirée n’existe plus', async () => {
    const fixture = TestBed.createComponent(PartieEcran);
    fixture.componentRef.setInput('id', 'perdue');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    http.expectOne('/api/v1/parties/perdue').flush(null, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Partie introuvable');
  });
});

describe('ChoixDeck', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChoixDeck],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('liste les decks prêtés, crée la partie et ouvre son écran', async () => {
    const fixture = TestBed.createComponent(ChoixDeck);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('/api/v1/decks')
      .flush([{ id: 'moderne', nom: 'Moderne', description: 'API et EDA.', cartes: [] }]);
    await fixture.whenStable();
    fixture.detectChanges();
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Comment gagner ?');
    bouton(page, 'Jouer avec Moderne')?.click();
    const creation = http.expectOne('/api/v1/parties');
    expect(creation.request.body).toEqual({ deck: 'moderne' });
    creation.flush(partie(vue()));
    await fixture.whenStable();
    expect(naviguer).toHaveBeenCalledWith(['/jouer', 'p1']);
  });
});
