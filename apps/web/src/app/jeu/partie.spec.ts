import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { ChoixDeck } from './choix-deck';
import type { Partie, Vue } from './modele';
import { CompteService } from '../compte/compte.service';
import { PartieEcran } from './partie';

const GARDE = {
  id: 'garde',
  nom: 'Garde',
  description: 'Doit être attaqué avant vos autres composants et votre SI.',
};

const NIVEAUX = [{ id: 'agent-autonome', nom: 'Agent autonome', description: 'Expert.' }];

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
  niveau: 'agent-autonome',
  vue: v,
  evenements,
});

async function ouvrir(v: Vue = vue(), complement: Partial<Partie> = {}) {
  const fixture = TestBed.createComponent(PartieEcran);
  fixture.componentRef.setInput('id', 'p1');
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  http.expectOne('/api/v1/cartes').flush(CATALOGUE);
  http.expectOne('/api/v1/niveaux').flush(NIVEAUX);
  http.expectOne('/api/v1/parties/p1').flush({
    ...partie(v, [{ type: 'pose', joueur: 'j2', carte: { id: 'j2-05', numero: 17 } }]),
    ...complement,
  });
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
    expect(page.textContent).toContain('Niveau : Agent autonome');
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

  it('affiche en grand la carte choisie, avec ses actions dessous, et Échap rend le focus à la main', async () => {
    const { fixture, page } = await ouvrir();
    bouton(page, 'API REST')?.click();
    fixture.detectChanges();
    const detail = page.querySelector<HTMLElement>('#detail-main');
    expect(detail?.querySelector('h3')?.textContent).toContain('API REST');
    expect(detail?.textContent).toContain('Composant');
    expect(detail?.textContent).toContain('Attaque 3');
    expect(detail?.textContent).toContain('Des ressources et des verbes HTTP.');
    expect(detail?.querySelector('[role="group"]')?.textContent).toContain('Poser (2 Débit)');
    expect(bouton(page, 'API REST')?.getAttribute('aria-controls')).toBe('detail-main');

    detail?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(page.querySelector('#detail-main')).toBeNull();
    expect(document.activeElement).toBe(page.querySelector('#main-j1-01'));
  });

  it('définit les capacités de la carte choisie là où on la lit', async () => {
    const v = vue();
    v.moi.main = [{ id: 'j1-04', numero: 13 }];
    const { fixture, page } = await ouvrir(v);
    bouton(page, 'Adaptateur SAP')?.click();
    fixture.detectChanges();
    expect(page.querySelector('#detail-main dl')?.textContent).toContain(
      'Doit être attaqué avant vos autres composants et votre SI.',
    );
    bouton(page, 'Fermer le détail')?.click();
    fixture.detectChanges();
    expect(page.querySelector('#detail-main')).toBeNull();
  });

  it('pendant le tour adverse, la carte se consulte quand même, sans actions', async () => {
    const { fixture, page } = await ouvrir(vue({ actif: 'j2', actions: [] }));
    const carte = bouton(page, 'API REST');
    expect(carte?.disabled).toBe(false);
    carte?.click();
    fixture.detectChanges();
    const detail = page.querySelector('#detail-main');
    expect(detail?.textContent).toContain('API REST');
    expect(detail?.querySelector('[role="group"]')).toBeNull();
    expect(detail?.textContent).toContain('vous pourrez jouer cette carte au prochain');
  });

  it('choisit un attaquant, puis sa cible, et confirme l’attaque sous le détail de la cible (US-041)', async () => {
    const attaquant = {
      id: 'j1-02',
      numero: 22,
      pv: 2,
      attaque: 3,
      poseAuTour: 1,
      aAttaqueCeTour: false,
      sansAttaque: null,
    };
    const v = vue({
      actions: [{ type: 'attaquer', attaquant: 'j1-02', cible: 'j2-05' }, { type: 'finirTour' }],
    });
    v.moi.plateau = [attaquant];
    const { fixture, http, page } = await ouvrir(v);
    // Le SI n'est pas une cible proposée (Garde) : il se consulte, mais ne s'attaque pas.
    bouton(page, 'SI du bot')?.click();
    fixture.detectChanges();
    expect(page.querySelector('#detail-plateau h3')?.textContent).toContain('SI du bot');
    expect(bouton(page, 'Attaquer avec')).toBeUndefined();

    bouton(page, 'peut attaquer')?.click();
    fixture.detectChanges();
    expect(page.querySelector('#detail-plateau')?.textContent).toContain('Attaquant désigné');
    const cible = bouton(page, 'SOAP / WSDL, attaque 3, PV 4 : cible possible');
    cible?.click();
    fixture.detectChanges();
    // Regarder ne joue rien : aucune requête, le détail de la cible s'affiche avec son état.
    http.expectNone('/api/v1/parties/p1/actions');
    expect(cible?.getAttribute('aria-pressed')).toBe('true');
    const detail = page.querySelector('#detail-plateau');
    expect(detail?.querySelector('h3')?.textContent).toContain('SOAP / WSDL');
    expect(detail?.textContent).toContain('attaque 3, PV 4 / 4');
    expect(detail?.textContent).toContain('Le service web d’avant REST.');
    expect(page.textContent).toContain('Confirmez l’attaque sous le détail de la cible');

    bouton(page, 'Attaquer avec API REST')?.click();
    const requete = http.expectOne('/api/v1/parties/p1/actions');
    expect(requete.request.body).toEqual({ type: 'attaquer', attaquant: 'j1-02', cible: 'j2-05' });
    requete.flush(partie(vue()));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('#detail-plateau')).toBeNull();
  });

  it('dit pourquoi un de mes composants n’attaque pas, avec les mots du serveur', async () => {
    const v = vue();
    v.moi.plateau = [
      {
        id: 'j1-02',
        numero: 22,
        pv: 1,
        attaque: 3,
        poseAuTour: 2,
        aAttaqueCeTour: false,
        sansAttaque: 'Un composant ne peut pas attaquer le tour où il est posé.',
      },
    ];
    const { fixture, page } = await ouvrir(v);
    const jeton = bouton(page, 'API REST, attaque 3, PV 1');
    expect(jeton?.disabled).toBe(false);
    jeton?.click();
    fixture.detectChanges();
    const detail = page.querySelector('#detail-plateau');
    expect(detail?.textContent).toContain('PV 1 / 2');
    expect(detail?.textContent).toContain('le tour où il est posé');
    expect(detail?.querySelector('[role="group"]')).toBeNull();

    // Échap referme le détail et rend le focus au jeton.
    detail?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(page.querySelector('#detail-plateau')).toBeNull();
    expect(document.activeElement).toBe(page.querySelector('#plateau-j1-02'));
  });

  it('pendant le tour adverse, un composant adverse se consulte quand même, sans attaque', async () => {
    const v = vue({ actif: 'j2', actions: [] });
    v.adversaire.plateau[0] = { ...v.adversaire.plateau[0]!, pv: 2, aAttaqueCeTour: true };
    const { fixture, page } = await ouvrir(v);
    const jeton = bouton(page, 'SOAP / WSDL');
    expect(jeton?.disabled).toBe(false);
    jeton?.click();
    fixture.detectChanges();
    const detail = page.querySelector('#detail-plateau');
    expect(detail?.textContent).toContain('PV 2 / 4');
    expect(detail?.textContent).toContain('A déjà attaqué ce tour');
    expect(detail?.textContent).toContain('vous pourrez attaquer au prochain');
    expect(bouton(page, 'Attaquer avec')).toBeUndefined();

    // Un seul détail à la fois : choisir une carte de la main remplace celui du plateau.
    bouton(page, 'API REST')?.click();
    fixture.detectChanges();
    expect(page.querySelector('#detail-plateau')).toBeNull();
    expect(page.querySelector('#detail-main')).not.toBeNull();
  });

  it('dit dans la règle courte qu’il faut choisir l’attaquant puis sa cible, avec un exemple de riposte', async () => {
    const debut = vue();
    debut.moi.tours = 1;
    const { page } = await ouvrir(debut);
    const regle = page.querySelector('hip-regle-courte')?.textContent ?? '';
    expect(regle).toContain('rien n’attaque tout seul');
    expect(regle).toContain('sélectionnez l’attaquant');
    expect(regle).toContain('confirmez');
    expect(regle).toContain('Exemple de riposte');
  });

  it('avertit, sans bloquer, des composants qui peuvent encore attaquer avant de finir le tour', async () => {
    const composant = (id: string, numero: number) => ({
      id,
      numero,
      pv: 2,
      attaque: 3,
      poseAuTour: 1,
      aAttaqueCeTour: false,
    });
    const v = vue({
      actions: [
        { type: 'attaquer', attaquant: 'j1-02', cible: 'j2-05' },
        { type: 'attaquer', attaquant: 'j1-02', cible: 'si' },
        { type: 'finirTour' },
      ],
    });
    v.moi.plateau = [composant('j1-02', 22)];
    const { fixture, http, page } = await ouvrir(v);
    const finir = bouton(page, 'Finir mon tour');
    expect(page.querySelector('#attaques-oubliees')?.textContent).toContain(
      'API REST peut encore attaquer',
    );
    expect(finir?.getAttribute('aria-describedby')).toBe('attaques-oubliees');
    expect(finir?.disabled).toBe(false);
    finir?.click();
    const requete = http.expectOne('/api/v1/parties/p1/actions');
    expect(requete.request.body).toEqual({ type: 'finirTour' });
    requete.flush(partie(vue()));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('#attaques-oubliees')).toBeNull();
    expect(bouton(page, 'Finir mon tour')?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('compte les composants qui peuvent encore attaquer quand il y en a plusieurs', async () => {
    const v = vue({
      actions: [
        { type: 'attaquer', attaquant: 'j1-02', cible: 'si' },
        { type: 'attaquer', attaquant: 'j1-03', cible: 'si' },
        { type: 'finirTour' },
      ],
    });
    v.moi.plateau = [
      { id: 'j1-02', numero: 22, pv: 2, attaque: 3, poseAuTour: 1, aAttaqueCeTour: false },
      { id: 'j1-03', numero: 13, pv: 5, attaque: 3, poseAuTour: 1, aAttaqueCeTour: false },
    ];
    const { page } = await ouvrir(v);
    expect(page.querySelector('#attaques-oubliees')?.textContent).toContain(
      '2 composants peuvent encore attaquer (API REST, Adaptateur SAP)',
    );
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

  it('propose « Poser et renforcer … » pour OpenAPI et envoie la cible', async () => {
    const v = vue({
      actions: [{ type: 'poser', carte: 'j1-01', cible: 'j1-02' }, { type: 'finirTour' }],
    });
    v.moi.plateau = [
      { id: 'j1-02', numero: 22, pv: 2, attaque: 3, poseAuTour: 1, aAttaqueCeTour: false },
    ];
    const { fixture, http, page } = await ouvrir(v);
    page.querySelector<HTMLButtonElement>('section[aria-labelledby="titre-main"] button')?.click();
    fixture.detectChanges();
    bouton(page, 'Poser et renforcer API REST (2 Débit)')?.click();
    const requete = http.expectOne('/api/v1/parties/p1/actions');
    expect(requete.request.body).toEqual({ type: 'poser', carte: 'j1-01', cible: 'j1-02' });
    requete.flush(partie(vue()));
    await fixture.whenStable();
  });

  it('propose la Migration depuis la main et l’Outillage pour les agents', async () => {
    const v = vue({
      actions: [
        { type: 'migrer', source: 'j1-02', carte: 'j1-01' },
        { type: 'outiller', source: 'j1-02' },
        { type: 'finirTour' },
      ],
    });
    v.moi.plateau = [
      { id: 'j1-02', numero: 17, pv: 4, attaque: 3, poseAuTour: 1, aAttaqueCeTour: false },
    ];
    const { fixture, http, page } = await ouvrir(v);
    const outillage = bouton(page, 'Outillage : vos agents prennent les capacités de SOAP / WSDL');
    expect(outillage).toBeTruthy();
    page.querySelector<HTMLButtonElement>('section[aria-labelledby="titre-main"] button')?.click();
    fixture.detectChanges();
    bouton(page, 'Migrer SOAP / WSDL vers cette carte (0 Débit)')?.click();
    const requete = http.expectOne('/api/v1/parties/p1/actions');
    expect(requete.request.body).toEqual({ type: 'migrer', source: 'j1-02', carte: 'j1-01' });
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

  it('annonce le booster gagné par la victoire et mène à son ouverture', async () => {
    const v = vue({ issue: { gagnant: 'j1', raison: 'sla' }, actions: [] });
    const { page } = await ouvrir(v, {
      recompense: { booster: true, plafondAtteint: false, motif: null },
    });
    expect(page.textContent).toContain('Un booster gagné !');
    expect(page.querySelector('a[href="/boosters"]')?.textContent?.trim()).toBe(
      'Ouvrir mon booster',
    );
  });

  it('annonce le plafond quotidien de boosters gagnés', async () => {
    const v = vue({ issue: { gagnant: 'j1', raison: 'sla' }, actions: [] });
    const { page } = await ouvrir(v, {
      recompense: { booster: false, plafondAtteint: true, motif: 'plafond' },
    });
    expect(page.textContent).toContain('Plafond atteint : 3 boosters gagnés aujourd’hui');
    expect(page.querySelector('a[href="/boosters"]')).toBeNull();
  });

  it('sans compte, une victoire invite à en créer un pour gagner des boosters', async () => {
    TestBed.inject(CompteService).pret.set(true);
    const v = vue({ issue: { gagnant: 'j1', raison: 'sla' }, actions: [] });
    const { page } = await ouvrir(v);
    expect(page.textContent).toContain('Avec un compte, chaque victoire rapporte un booster');
    expect(page.querySelector('a[href="/compte"]')).not.toBeNull();
  });

  it('explique qu’une partie expirée n’existe plus', async () => {
    const fixture = TestBed.createComponent(PartieEcran);
    fixture.componentRef.setInput('id', 'perdue');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    http.expectOne('/api/v1/niveaux').flush(NIVEAUX);
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
    http.expectOne('/api/v1/niveaux').flush([
      { id: 'stagiaire', nom: 'Stagiaire', description: 'Facile.' },
      { id: 'agent-autonome', nom: 'Agent autonome', description: 'Expert.' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const page = fixture.nativeElement as HTMLElement;
    const radios = page.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios[0]?.checked).toBe(true);
    radios[1]?.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('Comment gagner ?');
    bouton(page, 'Jouer avec Moderne')?.click();
    const creation = http.expectOne('/api/v1/parties');
    expect(creation.request.body).toEqual({ deck: 'moderne', niveau: 'agent-autonome' });
    creation.flush(partie(vue()));
    await fixture.whenStable();
    expect(naviguer).toHaveBeenCalledWith(['/jouer', 'p1']);
  });
});

describe('PartieEcran en duel (US-034)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PartieEcran],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  const duel = (v: Vue, version: number, evenements: Partie['evenements'] = []) => ({
    id: 'p1',
    statut: 'en-cours',
    version,
    createur: { pseudo: 'Ada' },
    deckCreateur: 'moderne',
    adversaire: { pseudo: 'Bob' },
    moi: 'j1',
    curseur: 10 + version,
    echeance: new Date(Date.now() + 10 * 60 * 60 * 1000 + 30_000).toISOString(),
    vue: v,
    evenements,
  });

  async function ouvrirDuel(v: Vue) {
    const fixture = TestBed.createComponent(PartieEcran);
    fixture.componentRef.setInput('id', 'p1');
    fixture.componentRef.setInput('mode', 'duel');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    http.expectOne('/api/v1/niveaux').flush(NIVEAUX);
    http.expectOne('/api/v1/duels/p1').flush(duel(v, 4));
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, http, page: fixture.nativeElement as HTMLElement };
  }

  it('sans mode lié par la route (undefined), reste une partie contre le bot', () => {
    const fixture = TestBed.createComponent(PartieEcran);
    fixture.componentRef.setInput('id', 'p1');
    fixture.componentRef.setInput('mode', undefined);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    expect(http.match('/api/v1/parties/p1')).toHaveLength(1);
    expect(http.match('/api/v1/duels/p1')).toHaveLength(0);
  });

  it('nomme l’adversaire et envoie ses actions au duel, avec la version connue', async () => {
    const { fixture, http, page } = await ouvrirDuel(vue());
    expect(page.querySelector('h1')?.textContent).toContain('Duel contre Bob');
    expect(page.querySelector('#titre-bot')?.textContent).toContain('Bob');
    expect(page.textContent).not.toContain('Niveau :');

    bouton(page, 'Finir mon tour')?.click();
    const action = http.expectOne('/api/v1/duels/p1/actions');
    expect(action.request.headers.get('If-Match')).toBe('"4"');
    action.flush(duel(vue({ actif: 'j2', actions: [] }), 5));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Au tour de Bob');
  });

  it('pendant le tour adverse, redemande le duel et affiche les coups de l’adversaire', async () => {
    // Seul setInterval est simulé : Angular garde ses vrais setTimeout pour se stabiliser.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      const { fixture, http, page } = await ouvrirDuel(vue({ actif: 'j2', actions: [] }));
      await vi.advanceTimersByTimeAsync(3000);
      const relecture = http.expectOne((r) => r.url === '/api/v1/duels/p1');
      expect(relecture.request.params.get('depuis')).toBe('14');
      expect(relecture.request.headers.get('If-None-Match')).toBe('"4"');
      relecture.flush(
        duel(vue(), 6, [{ type: 'pose', joueur: 'j2', carte: { id: 'j2-05', numero: 17 } }]),
      );
      await fixture.whenStable();
      fixture.detectChanges();
      expect(page.querySelector('[role="log"]')?.textContent).toContain('Bob pose');
      expect(bouton(page, 'Finir mon tour')?.disabled).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('affiche l’échéance, et abandonne après confirmation : la fin en donne la raison', async () => {
    const { fixture, http, page } = await ouvrirDuel(vue());
    expect(page.textContent).toContain('À vous de jouer dans les 10 h 0 min, sinon forfait.');

    bouton(page, 'Abandonner')?.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('Abandonner ce duel ? Bob gagnera.');
    bouton(page, 'Non, continuer')?.click();
    fixture.detectChanges();
    expect(bouton(page, 'Oui, abandonner')).toBeUndefined();

    bouton(page, 'Abandonner')?.click();
    fixture.detectChanges();
    bouton(page, 'Oui, abandonner')?.click();
    const abandon = http.expectOne('/api/v1/duels/p1/abandon');
    expect(abandon.request.method).toBe('POST');
    abandon.flush({
      ...duel(vue({ issue: { gagnant: 'j2', raison: 'abandon' }, actions: [] }), 5),
      statut: 'termine',
      echeance: null,
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('#titre-fin')?.textContent).toContain('Défaite');
    expect(page.textContent).toContain('Vous avez abandonné.');
    expect(bouton(page, 'Abandonner')).toBeUndefined();
  });

  it('annonce la victoire par abandon, et pourquoi elle ne rapporte pas de booster', async () => {
    const fixture = TestBed.createComponent(PartieEcran);
    fixture.componentRef.setInput('id', 'p1');
    fixture.componentRef.setInput('mode', 'duel');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    http.expectOne('/api/v1/niveaux').flush(NIVEAUX);
    http.expectOne('/api/v1/duels/p1').flush({
      ...duel(vue({ issue: { gagnant: 'j1', raison: 'abandon' }, actions: [] }), 7),
      statut: 'termine',
      echeance: null,
      recompense: { booster: false, plafondAtteint: false, motif: 'adversaire-deja-affronte' },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('#titre-fin')?.textContent).toContain('Victoire !');
    expect(page.textContent).toContain('Bob a abandonné.');
    expect(page.textContent).toContain('ne compte qu’une fois par jour contre le même adversaire');
  });
});
