import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { CarteDetaillee, Fiche } from './carte';
import { EnSavoirPlus } from './en-savoir-plus';

const FICHE: Fiche = {
  definition: 'File Transfer Protocol : le protocole historique.',
  usage: 'Déposer ou récupérer des fichiers.',
  exemple: 'Un partenaire dépose commandes.csv.',
  aRetenir: 'FTP ne chiffre rien.',
  chezElis: 'Interdit chez Elis.',
  liens: [
    {
      titre: 'File Transfer Protocol',
      url: 'https://fr.wikipedia.org/wiki/File_Transfer_Protocol',
      langue: 'fr',
    },
    { titre: 'RFC 959', url: 'https://www.rfc-editor.org/rfc/rfc959.html', langue: 'en' },
  ],
};

const FTP: CarteDetaillee = {
  numero: 1,
  nom: 'FTP',
  famille: 'fichiers',
  type: 'composant',
  rarete: 'legendaire',
  cout: 3,
  attaque: 5,
  pv: 4,
  capacites: [],
  enVrai: 'Transfert de fichiers en clair.',
};

function creer(carte: CarteDetaillee, charger = false) {
  const fixture = TestBed.createComponent(EnSavoirPlus);
  fixture.componentRef.setInput('carte', carte);
  fixture.componentRef.setInput('charger', charger);
  fixture.detectChanges();
  const page = fixture.nativeElement as HTMLElement;
  const bouton = () => page.querySelector<HTMLButtonElement>('button[aria-expanded]');
  const fiche = () =>
    page.querySelector<HTMLElement>(`#${bouton()?.getAttribute('aria-controls')}`);
  return { fixture, page, bouton, fiche };
}

describe('EnSavoirPlus', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EnSavoirPlus],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('déplie et replie la fiche d’une carte, repliée au départ', async () => {
    const { fixture, bouton, fiche } = creer({ ...FTP, fiche: FICHE });
    expect(bouton()?.textContent).toContain('En savoir plus');
    expect(bouton()?.getAttribute('aria-expanded')).toBe('false');
    expect(fiche()?.hidden).toBe(true);

    bouton()?.click();
    await fixture.whenStable();
    expect(bouton()?.getAttribute('aria-expanded')).toBe('true');
    expect(fiche()?.hidden).toBe(false);
    for (const texte of [
      'C’est quoi ?',
      'le protocole historique',
      'À quoi ça sert ?',
      'Chez Elis',
    ])
      expect(fiche()?.textContent).toContain(texte);

    bouton()?.click();
    await fixture.whenStable();
    expect(fiche()?.hidden).toBe(true);
  });

  it('ouvre les liens externes dans un nouvel onglet, sans transmettre la page d’origine, langue signalée', async () => {
    const { fixture, page, bouton } = creer({ ...FTP, fiche: FICHE });
    bouton()?.click();
    await fixture.whenStable();
    const liens = [...page.querySelectorAll('a')];
    expect(liens.map((a) => a.getAttribute('href'))).toEqual(FICHE.liens.map((l) => l.url));
    for (const lien of liens) {
      expect(lien.target).toBe('_blank');
      expect(lien.rel).toBe('noopener noreferrer');
      expect(lien.textContent).toContain('(nouvel onglet)');
    }
    expect(liens[1]?.getAttribute('hreflang')).toBe('en');
    expect(page.textContent).toContain('rfc-editor.org · en anglais');
    expect(page.textContent).toContain('ouvrent un autre site');
  });

  it('n’affiche pas de bouton pour une carte sans fiche', () => {
    const { bouton } = creer(FTP);
    expect(bouton()).toBeNull();
  });

  it('titre l’usage d’un incident par « Comment ça arrive ? »', async () => {
    const incident: CarteDetaillee = { ...FTP, type: 'incident', ia: false, fiche: FICHE };
    const { fixture, bouton, fiche } = creer(incident);
    bouton()?.click();
    await fixture.whenStable();
    expect(fiche()?.textContent).toContain('Comment ça arrive ?');
  });

  it('en partie, charge la fiche à la première ouverture seulement', async () => {
    const { fixture, bouton, fiche } = creer(FTP, true);
    const http = TestBed.inject(HttpTestingController);
    http.expectNone('/api/v1/cartes/1');

    bouton()?.click();
    fixture.detectChanges();
    expect(fiche()?.textContent).toContain('Chargement de la fiche');
    http.expectOne('/api/v1/cartes/1').flush({ ...FTP, fiche: FICHE });
    await fixture.whenStable();
    expect(fiche()?.textContent).toContain('le protocole historique');

    bouton()?.click();
    bouton()?.click();
    await fixture.whenStable();
    http.expectNone('/api/v1/cartes/1');
    http.verify();
  });

  it('en partie, dit qu’une fiche reste à écrire, et propose de réessayer après une erreur', async () => {
    const { fixture, bouton, fiche } = creer(FTP, true);
    const http = TestBed.inject(HttpTestingController);
    bouton()?.click();
    fixture.detectChanges();
    http
      .expectOne('/api/v1/cartes/1')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();
    expect(fiche()?.textContent).toContain('La fiche n’a pas pu être chargée.');

    fiche()?.querySelector('button')?.click();
    fixture.detectChanges();
    http.expectOne('/api/v1/cartes/1').flush(FTP);
    await fixture.whenStable();
    expect(fiche()?.textContent).toContain('en cours d’écriture');
  });
});
