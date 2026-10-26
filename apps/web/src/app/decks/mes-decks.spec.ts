import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import type { MonDeck } from './mes-decks.service';
import { MesDecksEcran, nomCopie } from './mes-decks';

const REGLES = { taille: 20, exemplairesMax: 2, exemplairesMaxLegendaire: 1, decksMax: 5 };
const deck = (id: string, nom: string, complet: boolean, liberees = 0): MonDeck => ({
  id,
  nom,
  cartes: complet ? Array.from({ length: 20 }, () => 2) : [2, 2],
  complet,
  liberees,
  majLe: '2026-10-26T00:00:00Z',
});
const PRETE = {
  id: 'heritage',
  nom: 'Héritage',
  description: 'Fichiers et ESB.',
  cartes: [2, 2, 3, 4],
};

describe('Mes decks (US-083)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MesDecksEcran],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'decks/:id', children: [] }]),
      ],
    });
  });

  async function afficher(decks: MonDeck[]) {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
    const fixture = TestBed.createComponent(MesDecksEcran);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush([]);
    http.expectOne('/api/v1/decks').flush([PRETE]);
    http.expectOne('/api/v1/moi/collection').flush({
      cartes: [
        { numero: 2, exemplaires: 1 },
        { numero: 4, exemplaires: 1 },
      ],
    });
    http.expectOne('/api/v1/moi/decks').flush({ regles: REGLES, decks });
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, page: fixture.nativeElement as HTMLElement, http };
  }

  const bouton = (page: HTMLElement, texte: string) =>
    [...page.querySelectorAll('button')].find((b) => b.textContent?.includes(texte));

  it('montre mes decks, leur état et les places libérées', async () => {
    const { page } = await afficher([deck('a', 'Rapide', true), deck('b', 'Lent', false, 2)]);
    expect(page.querySelector('#titre-mes-decks')?.textContent).toContain('Vos decks (2 / 5)');
    const boites = [...page.querySelectorAll('hip-boite-deck')].map((b) =>
      b.textContent?.replace(/\s+/g, ' '),
    );
    expect(boites[0]).toContain('20 / 20 cartes.');
    expect(boites[1]).toContain('2 / 20 cartes.');
    expect(boites[1]).toContain('2 cartes ont quitté votre collection : leur place est libre.');
    expect(page.querySelector('a[href="/decks/nouveau"]')).toBeTruthy();
  });

  it('copie un deck prêté limité aux cartes possédées, puis l’ouvre', async () => {
    const { fixture, page, http } = await afficher([]);
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate');
    expect(page.textContent).toContain('Vous possédez 2 de ses 4 cartes.');
    bouton(page, 'Copier Héritage')?.click();
    const requete = http.expectOne('/api/v1/moi/decks');
    expect(requete.request.body).toEqual({ nom: 'Héritage', cartes: [2, 4] });
    requete.flush({ ...deck('c', 'Héritage', false), cartes: [2, 4] });
    await fixture.whenStable();
    expect(navigation).toHaveBeenCalledWith(['/decks', 'c']);
  });

  it('duplique et supprime après confirmation ; au plafond, plus de création', async () => {
    const decks = ['a', 'b', 'c', 'd'].map((id) => deck(id, `Deck ${id}`, true));
    const { fixture, page, http } = await afficher(decks);

    bouton(page, 'Dupliquer')?.click();
    const copie = http.expectOne('/api/v1/moi/decks');
    expect(copie.request.body).toMatchObject({ nom: 'Deck a (copie)' });
    copie.flush(deck('e', 'Deck a (copie)', true));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('a[href="/decks/nouveau"]')).toBeNull();
    expect(page.textContent).toContain('5 decks au plus : supprimez-en un pour en créer un autre.');
    expect(bouton(page, 'Copier Héritage')?.disabled).toBe(true);

    bouton(page, 'Supprimer')?.click();
    fixture.detectChanges();
    bouton(page, 'Confirmer la suppression')?.click();
    const suppression = http.expectOne('/api/v1/moi/decks/a');
    expect(suppression.request.method).toBe('DELETE');
    suppression.flush(null);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('#titre-mes-decks')?.textContent).toContain('Vos decks (4 / 5)');
  });

  it('raccourcit le nom d’une copie à 30 caractères', () => {
    expect(nomCopie('Un nom de deck vraiment très long')).toHaveLength(30);
    expect(nomCopie('Court')).toBe('Court (copie)');
  });
});
