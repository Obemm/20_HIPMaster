import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import type { Deck } from '../jeu/modele';
import { DuelEcran } from './duel';
import type { Duel } from './modele';

const ID = '00000000-0000-4000-8000-0000000000d1';
const DECKS: Deck[] = [
  { id: 'heritage', nom: 'Héritage', description: 'Fichiers et ESB', cartes: [] },
  { id: 'moderne', nom: 'Moderne', description: 'API et événements', cartes: [] },
];
const duel = (modifs: Partial<Duel> = {}): Duel => ({
  id: ID,
  statut: 'attente',
  version: 0,
  createur: { pseudo: 'Ada' },
  deckCreateur: 'moderne',
  ouvert: false,
  adversaire: null,
  moi: 'j1',
  curseur: 0,
  echeance: null,
  vue: null,
  evenements: [],
  ...modifs,
});

describe('DuelEcran', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DuelEcran],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
  });

  async function afficher(reponse: Duel | { status: number }, connecte = true) {
    const compte = TestBed.inject(CompteService);
    if (connecte) compte.joueur.set({ id: 'x', pseudo: 'Moi' });
    else compte.pret.set(true);
    const fixture = TestBed.createComponent(DuelEcran);
    fixture.componentRef.setInput('id', ID);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/decks').flush(DECKS);
    if (connecte) {
      const lecture = http.expectOne(`/api/v1/duels/${ID}`);
      if ('status' in reponse) {
        lecture.flush(
          { title: 'x', status: reponse.status },
          { status: reponse.status, statusText: 'x' },
        );
      } else {
        lecture.flush(reponse);
      }
    }
    // Un défi à relever charge le catalogue, pour les cartes phares des decks (US-068), une fois le duel lu.
    await new Promise((fin) => setTimeout(fin));
    TestBed.tick();
    for (const requete of http.match('/api/v1/cartes')) requete.flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, http, page: fixture.nativeElement as HTMLElement };
  }

  const bouton = (page: HTMLElement, texte: string) =>
    [...page.querySelectorAll('button')].find((b) => b.textContent?.includes(texte));

  it('montre au créateur le lien de son défi, à copier, et lui permet de l’annuler', async () => {
    const { fixture, http, page } = await afficher(duel());
    expect(page.querySelector('h1')?.textContent).toContain('Votre défi est lancé');
    expect(page.querySelector<HTMLInputElement>('#lien-defi')?.value).toContain(`/duels/${ID}`);
    expect(page.textContent).toContain('Votre deck : Moderne');

    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    bouton(page, 'Annuler le défi')?.click();
    const annulation = http.expectOne(`/api/v1/duels/${ID}`);
    expect(annulation.request.method).toBe('DELETE');
    annulation.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    expect(naviguer).toHaveBeenCalledWith(['/duels/nouveau']);
  });

  it('invite un collègue à relever le défi avec son deck, puis affiche le plateau du duel', async () => {
    const { fixture, http, page } = await afficher(duel({ moi: null }));
    expect(page.querySelector('h1')?.textContent).toContain('Ada vous défie en duel !');
    expect(page.textContent).toContain('Ada joue le deck Moderne');

    bouton(page, 'Relever le défi avec Héritage')?.click();
    const rejoindre = http.expectOne(`/api/v1/duels/${ID}/rejoindre`);
    expect(rejoindre.request.body).toEqual({ deck: 'heritage' });
    rejoindre.flush(
      duel({
        statut: 'en-cours',
        moi: 'j2',
        adversaire: { pseudo: 'Moi' },
        vue: { actif: 'j1' } as Duel['vue'],
      }),
    );
    await new Promise((fin) => setTimeout(fin));
    fixture.detectChanges();
    // Le plateau du duel (écran de partie en mode duel) prend le relais et charge le duel.
    expect(page.querySelector('hip-partie')).not.toBeNull();
    expect(http.match(`/api/v1/duels/${ID}`)).toHaveLength(1);
  });

  it('sans compte, invite à en créer un puis à revenir au défi', async () => {
    const { page } = await afficher(duel(), false);
    const lien = page.querySelector<HTMLAnchorElement>('main a[href^="/compte"]');
    expect(lien?.getAttribute('href')).toBe(`/compte?retour=%2Fduels%2F${ID}`);
  });

  it('explique un défi introuvable ou expiré', async () => {
    const { page } = await afficher({ status: 410 });
    expect(page.querySelector('h1')?.textContent).toContain('Défi expiré');
  });

  it('un identifiant qui n’est pas un UUID : « Défi introuvable », sans appel à l’API (US-055)', async () => {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Moi' });
    const fixture = TestBed.createComponent(DuelEcran);
    fixture.componentRef.setInput('id', '../../v1/raretes');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/decks').flush(DECKS);
    await fixture.whenStable();
    fixture.detectChanges();
    http.verify();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Défi introuvable',
    );
  });

  it('si le duel n’a pas pu être lu, dit pourquoi et le relit quand on réessaie (US-055)', async () => {
    const { fixture, http, page } = await afficher({ status: 503 });
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Le duel n’a pas pu être chargé. Serveur injoignable pour le moment',
    );
    bouton(page, 'Réessayer')?.click();
    http.expectOne(`/api/v1/duels/${ID}`).flush(duel());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('h1')?.textContent).toContain('Votre défi est lancé');
  });

  it('dans la file d’attente (duel ouvert), propose de la quitter, sans lien à partager', async () => {
    const { fixture, http, page } = await afficher(duel({ ouvert: true }));
    expect(page.querySelector('h1')?.textContent).toContain('Recherche d’un adversaire');
    expect(page.querySelector('#lien-defi')).toBeNull();
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    bouton(page, 'Quitter la file')?.click();
    http.expectOne(`/api/v1/duels/${ID}`).flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    expect(naviguer).toHaveBeenCalledWith(['/jouer']);
  });
});
