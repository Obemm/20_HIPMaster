import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { CompteService } from './compte/compte.service';

/** Une page factice, avec son propre `<main>` et son titre, comme les vraies. */
@Component({
  selector: 'hip-page-test',
  template: `<main><h1>Page</h1></main>`,
})
class PageTest {}

async function ouvrir() {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([
        { path: '', component: PageTest },
        { path: 'jouer', component: PageTest },
        { path: 'jouer/:id', component: PageTest },
        { path: 'duels', component: PageTest },
        { path: 'duels/nouveau', component: PageTest },
        { path: 'boosters', component: PageTest },
        { path: 'collection', component: PageTest },
        { path: 'compte', component: PageTest },
      ]),
    ],
  });
  const fixture = TestBed.createComponent(App);
  const router = TestBed.inject(Router);
  await router.navigateByUrl('/');
  await fixture.whenStable();
  fixture.detectChanges();
  const page = fixture.nativeElement as HTMLElement;
  const aller = async (url: string) => {
    await router.navigateByUrl(url);
    await fixture.whenStable();
    fixture.detectChanges();
  };
  return { fixture, page, aller, http: TestBed.inject(HttpTestingController) };
}

const nav = (page: HTMLElement) =>
  page.querySelector<HTMLElement>('nav[aria-label="Navigation principale"]');
const lien = (page: HTMLElement, debut: string) =>
  [...(nav(page)?.querySelectorAll('a') ?? [])].find((a) =>
    a.textContent?.replaceAll(/\s+/g, ' ').trim().startsWith(debut),
  );

describe('App (navigation, US-060)', () => {
  beforeEach(() => localStorage.clear());

  it('donne cinq onglets ; sans compte, le dernier propose d’en créer un', async () => {
    const { page } = await ouvrir();
    const liens = [...(nav(page)?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href'));
    expect(liens).toEqual(['/jouer', '/duels', '/boosters', '/collection', '/compte']);
    expect(lien(page, 'Créer un compte')).toBeTruthy();
  });

  it('signale l’onglet courant par aria-current', async () => {
    const { page, aller } = await ouvrir();
    await aller('/duels');
    expect(lien(page, 'Duels')?.getAttribute('aria-current')).toBe('page');
    expect(lien(page, 'Jouer')?.hasAttribute('aria-current')).toBe(false);
  });

  it('s’efface sur téléphone pendant une partie, pas sur les autres pages', async () => {
    const { page, aller } = await ouvrir();
    await aller('/jouer/00000000-0000-4000-8000-0000000000a1');
    expect(nav(page)?.classList).toContain('max-md:hidden');
    await aller('/duels/nouveau');
    expect(nav(page)?.classList).not.toContain('max-md:hidden');
  });

  it('donne le focus au titre de chaque nouvelle page', async () => {
    const { page, aller } = await ouvrir();
    await aller('/duels');
    const titre = page.querySelector('main h1');
    expect(document.activeElement).toBe(titre);
    expect(titre?.getAttribute('tabindex')).toBe('-1');
  });

  it('affiche le stock de boosters et les duels à jouer du joueur connecté', async () => {
    const { fixture, page, http } = await ouvrir();
    TestBed.inject(CompteService).joueur.set({ id: 'j-1', pseudo: 'Ada' });
    fixture.detectChanges();
    await fixture.whenStable();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 3, plafond: 5, prochainDans: 3600 });
    http.expectOne('/api/v1/moi/duels').flush({ aMonTour: 2, duels: [] });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(lien(page, 'Boosters')?.textContent).toContain('3 en stock');
    expect(lien(page, 'Duels')?.textContent).toContain('2 à vous de jouer');
    expect(lien(page, 'Mon compte')?.textContent).toContain('Mon compte : Ada');
  });
});
