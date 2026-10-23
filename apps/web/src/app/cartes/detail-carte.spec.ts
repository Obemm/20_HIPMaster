import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CollectionService } from '../collection/collection.service';
import { CompteService } from '../compte/compte.service';
import type { Carte } from './carte';
import { DetailCarte } from './detail-carte';

const WEBMETHODS_IO: Carte = {
  numero: 26,
  nom: 'webMethods.io',
  famille: 'ipaas',
  type: 'evolution',
  origine: 9,
  rarete: 'legendaire',
  cout: 5,
  attaque: 5,
  pv: 7,
  capacites: [
    { id: 'hub', nom: 'Hub', description: 'Vos autres composants ont +1 attaque.' },
    {
      id: 'connecteur',
      nom: 'Connecteur (2)',
      valeur: 2,
      description: 'Quand la carte est posée, piochez autant de cartes que la valeur indiquée.',
    },
  ],
  enVrai: 'L’intégration en mode iPaaS, sans serveur à maintenir.',
};

/** Une carte sans origine : pas de seconde requête en attente. */
const SANS_ORIGINE: Carte = { ...WEBMETHODS_IO, type: 'composant', origine: undefined };

function creer(numero: string) {
  const fixture = TestBed.createComponent(DetailCarte);
  fixture.componentRef.setInput('numero', numero);
  fixture.detectChanges();
  return fixture;
}

describe('DetailCarte', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DetailCarte],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('détaille les capacités, le texte « En vrai » et la carte d’origine d’une évolution', async () => {
    const fixture = creer('26');
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes/26').flush(WEBMETHODS_IO);
    // La carte reçue déclenche la requête de sa carte d'origine (pas de whenStable : elle est en attente).
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    http
      .expectOne('/api/v1/cartes/9')
      .flush({ ...WEBMETHODS_IO, numero: 9, nom: 'webMethods Integration Server 10.15' });
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('dialog')?.getAttribute('aria-labelledby')).toBe('titre-detail');
    expect(page.querySelector('#titre-detail')?.textContent).toContain('webMethods.io');
    expect(page.textContent).toContain('Connecteur (2)');
    expect(page.textContent).toContain('piochez autant de cartes');
    expect(page.textContent).toContain('sans serveur à maintenir');
    expect(page.querySelector('a[href="/cartes/9"]')?.textContent).toContain(
      'webMethods Integration Server 10.15',
    );
  });

  it('revient au catalogue quand on ferme la fenêtre, même sans donnée de route « retour »', async () => {
    const fixture = creer('26');
    fixture.componentRef.setInput('retour', undefined);
    TestBed.inject(HttpTestingController).expectOne('/api/v1/cartes/26').flush(SANS_ORIGINE);
    await fixture.whenStable();
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLButtonElement>('button')?.click();
    expect(naviguer).toHaveBeenCalledWith(['/cartes']);
  });

  it('depuis la collection, indique les exemplaires possédés et y revient à la fermeture', async () => {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
    TestBed.inject(CollectionService);
    const fixture = creer('26');
    fixture.componentRef.setInput('retour', '/collection');
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes/26').flush(SANS_ORIGINE);
    http.expectOne('/api/v1/moi/collection').flush({ cartes: [{ numero: 26, exemplaires: 2 }] });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Dans votre collection : 2 exemplaires.');
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    page.querySelector<HTMLButtonElement>('button')?.click();
    expect(naviguer).toHaveBeenCalledWith(['/collection']);
  });

  it('propose « En savoir plus » quand la carte a une fiche', async () => {
    const fixture = creer('26');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/cartes/26')
      .flush({
        ...SANS_ORIGINE,
        fiche: {
          definition: 'L’offre iPaaS de webMethods.',
          usage: 'Assembler des intégrations.',
          exemple: 'Un client créé dans le CRM.',
          aRetenir: 'Versionner les flux.',
          liens: [{ titre: 'iPaaS', url: 'https://en.wikipedia.org/wiki/iPaaS', langue: 'en' }],
        },
      });
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const bouton = page.querySelector<HTMLButtonElement>('button[aria-expanded]');
    expect(bouton?.textContent).toContain('En savoir plus');
    bouton?.click();
    await fixture.whenStable();
    expect(page.textContent).toContain('L’offre iPaaS de webMethods.');
  });

  it('annonce une carte introuvable quand l’API répond 404', async () => {
    const fixture = creer('72');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/cartes/72')
      .flush(
        { type: 'about:blank', title: 'Carte introuvable', status: 404 },
        { status: 404, statusText: 'Not Found' },
      );
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('#titre-detail')?.textContent).toContain('Carte introuvable');
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('« 72 »');
  });
});
