import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Carte } from './carte';
import { Catalogue } from './catalogue';

const CARTES: Carte[] = [
  {
    numero: 1,
    nom: 'FTP',
    famille: 'fichiers',
    type: 'composant',
    rarete: 'legendaire',
    cout: 3,
    attaque: 5,
    pv: 4,
    capacites: [
      { id: 'batch', nom: 'Batch', description: 'Ne peut pas attaquer deux tours de suite.' },
    ],
    enVrai: 'Transfert de fichiers en clair.',
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
    numero: 65,
    nom: 'Timeout',
    famille: 'bestiaire',
    type: 'incident',
    ia: false,
    rarete: 'commune',
    cout: 1,
    capacites: [],
    effet: 'Un composant adverse ne peut pas attaquer à son prochain tour.',
    enVrai: 'La réponse n’est jamais arrivée à temps.',
  },
];

async function afficher(reponse: Carte[] | 'erreur' = CARTES) {
  const fixture = TestBed.createComponent(Catalogue);
  fixture.detectChanges();
  const requete = TestBed.inject(HttpTestingController).expectOne('/api/v1/cartes');
  if (reponse === 'erreur') requete.flush(null, { status: 502, statusText: 'Bad Gateway' });
  else requete.flush(reponse);
  await fixture.whenStable();
  return fixture;
}

describe('Catalogue', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Catalogue],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('affiche chaque carte avec sa rareté, ses statistiques et un lien vers son détail', async () => {
    const page = (await afficher()).nativeElement as HTMLElement;
    expect(page.querySelectorAll('h2')).toHaveLength(3);
    expect(page.querySelector('[role="status"]')?.textContent).toContain('3 cartes affichées');
    const ftp = page.querySelector('a[href="/cartes/1"]')?.closest('li');
    expect(ftp?.textContent).toContain('★ Légendaire');
    expect(ftp?.textContent).toContain('Attaque 5');
    expect(ftp?.textContent).toContain('Batch');
    expect(page.textContent).toContain('Incident');
  });

  it('filtre par famille puis par rareté et annonce le nombre de cartes', async () => {
    const fixture = await afficher();
    const page = fixture.nativeElement as HTMLElement;
    const choisir = async (id: string, valeur: string) => {
      const select = page.querySelector<HTMLSelectElement>(`#${id}`);
      if (!select) throw new Error(`filtre ${id} absent`);
      select.value = valeur;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      await fixture.whenStable();
    };

    await choisir('filtre-rarete', 'commune');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('2 cartes affichées');
    await choisir('filtre-famille', 'api');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('1 carte affichée');
    expect(page.querySelector('h2')?.textContent).toContain('API REST');
    await choisir('filtre-famille', 'fichiers');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Aucune carte');
  });

  it('prévient quand l’API ne répond pas', async () => {
    const page = (await afficher('erreur')).nativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('l’API ne répond pas');
  });
});
