import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { CompteService } from '../compte/compte.service';
import { Accueil } from './accueil';

const carte = (numero: number, nom: string): Carte => ({
  numero,
  nom,
  famille: 'api',
  type: 'composant',
  rarete: 'commune',
  cout: 1,
  attaque: 1,
  pv: 1,
  capacites: [],
  enVrai: '',
});
const CATALOGUE = [
  carte(1, 'FTP'),
  carte(2, 'SFTP'),
  carte(18, 'Apigee API Gateway'),
  carte(39, 'Solace Agent Mesh'),
];

describe('Accueil', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Accueil],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  async function afficher(options: { connecte?: boolean; invitation?: string } = {}) {
    const compte = TestBed.inject(CompteService);
    if (options.connecte) compte.joueur.set({ id: 'x', pseudo: 'Ada' });
    else compte.pret.set(true);
    const fixture = TestBed.createComponent(Accueil);
    if (options.invitation) fixture.componentRef.setInput('invitation', options.invitation);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    return { fixture, http, page: fixture.nativeElement as HTMLElement };
  }

  /** Le catalogue lu : la page est alors stable. */
  async function afficherCatalogue(options: { connecte?: boolean; invitation?: string } = {}) {
    const vue = await afficher(options);
    vue.http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    await vue.fixture.whenStable();
    return vue;
  }

  it('présente le jeu : son nom, sa promesse, et trois cartes en éventail une fois le catalogue lu', async () => {
    const { fixture, http, page } = await afficher();
    // Pendant le chargement, trois dos de carte tiennent la place.
    expect(page.querySelectorAll('hip-dos-carte')).toHaveLength(3);

    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    await fixture.whenStable();
    expect(page.querySelector('h1')?.textContent).toBe('HIPMaster');
    expect(page.textContent).toContain('Le jeu de cartes de l’intégration');
    const eventail = page.querySelector('ul[aria-label="Quelques cartes du jeu"]');
    const noms = [...(eventail?.querySelectorAll('hip-vignette-carte') ?? [])].map((v) =>
      v.querySelector('p.font-titre')?.textContent?.trim(),
    );
    expect(noms).toEqual(['Apigee API Gateway', 'Solace Agent Mesh', 'FTP']);
    expect(page.querySelectorAll('hip-dos-carte')).toHaveLength(0);
  });

  it('invite un visiteur à jouer contre le bot, à découvrir les cartes et, s’il est invité, à créer son compte', async () => {
    const { page } = await afficherCatalogue();
    expect(page.querySelector('a.bouton-jeu')?.getAttribute('href')).toBe('/jouer');
    expect(page.querySelector('a.bouton-jeu')?.textContent).toContain('Jouer contre le bot');
    expect(page.querySelector('a[href="/cartes"]')?.textContent).toContain('Découvrir les cartes');
    expect(page.querySelector('a[href="/compte"]')?.textContent).toContain('Créez votre compte');
    expect(page.textContent).toContain('Comment on joue');
    expect(page.textContent).not.toContain('Votre jeu');
  });

  it('avec un lien d’invitation, l’action principale crée le compte avec ce code', async () => {
    const { page } = await afficherCatalogue({ invitation: 'ABCD-EFGH-JKLM-NPQR' });
    const action = page.querySelector('a.bouton-jeu');
    expect(action?.textContent).toContain('Créer mon compte');
    expect(action?.getAttribute('href')).toBe('/compte?invitation=ABCD-EFGH-JKLM-NPQR');
    expect(page.textContent).toContain('Vous êtes invité·e');
  });

  it('un joueur connecté retrouve ses duels, ses boosters et sa collection', async () => {
    const { fixture, http, page } = await afficher({ connecte: true });
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    http.expectOne('/api/v1/moi/collection').flush({
      cartes: [
        { numero: 1, exemplaires: 2 },
        { numero: 18, exemplaires: 1 },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Bon retour, Ada !');
    expect(page.textContent).toContain('Votre jeu');
    expect(page.querySelector('a[href="/collection"]')?.textContent).toContain('2 / 4 cartes');
    expect(page.querySelector('a[href="/duels"]')?.textContent).toContain('Défiez un collègue');
    expect(page.textContent).not.toContain('Comment on joue');
    expect(page.textContent).not.toContain('Créez votre compte');
  });

  it('montre les huit familles de cartes', async () => {
    const { page } = await afficherCatalogue();
    const familles = page.querySelectorAll('section[aria-labelledby="titre-familles"] li');
    expect(familles).toHaveLength(8);
    expect(familles[0]?.textContent).toContain('Fichiers & Batch');
  });
});
