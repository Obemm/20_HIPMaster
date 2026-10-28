import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { ContributeursEcran, GUIDE_CONTRIBUTEUR } from './contributeurs';

const carte = (numero: number, nom: string, auteur?: string): Carte => ({
  numero,
  nom,
  famille: 'api',
  type: 'composant',
  rarete: 'commune',
  cout: 2,
  attaque: 2,
  pv: 2,
  capacites: [],
  enVrai: 'Un texte.',
  ...(auteur === undefined ? {} : { auteur }),
});

async function afficher(reponse: Carte[] | 'erreur') {
  const fixture = TestBed.createComponent(ContributeursEcran);
  fixture.detectChanges();
  const requete = TestBed.inject(HttpTestingController).expectOne('/api/v1/cartes');
  if (reponse === 'erreur') requete.flush(null, { status: 502, statusText: 'Bad Gateway' });
  else requete.flush(reponse);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('ContributeursEcran', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ContributeursEcran],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('liste les auteurs, chacun avec ses cartes sous son nom', async () => {
    const page = await afficher([
      carte(1, 'FTP'),
      carte(76, 'Kafka Connect', 'Élodie M.'),
      carte(75, 'API First', 'Camille D.'),
      carte(77, 'Outbox', 'Camille D.'),
    ]);
    const sections = [...page.querySelectorAll('section')];
    expect(sections.map((s) => s.querySelector('h2')?.textContent?.trim())).toEqual([
      'Camille D.',
      'Élodie M.',
    ]);
    expect(sections[0]?.textContent).toContain('2 cartes publiées');
    expect(sections[1]?.textContent).toContain('1 carte publiée');
    // Les cartes se rangent sous leur auteur : titres de niveau 3.
    const titres = [...(sections[0]?.querySelectorAll('h3') ?? [])];
    expect(titres.map((t) => t.textContent?.trim())).toEqual(['API First', 'Outbox']);
    expect(page.querySelector('a[href="/contributeurs/75"]')).not.toBeNull();
    expect(page.textContent).not.toContain('FTP');
    expect(page.querySelector(`a[href="${GUIDE_CONTRIBUTEUR}"]`)).not.toBeNull();
  });

  it('dit qu’aucune carte de la communauté n’est encore publiée, et mène au guide', async () => {
    const page = await afficher([carte(1, 'FTP')]);
    expect(page.querySelector('h2')?.textContent).toContain(
      'Aucune carte de la communauté pour l’instant',
    );
    expect(page.querySelector(`a[href="${GUIDE_CONTRIBUTEUR}"]`)?.textContent).toContain(
      'guide du contributeur',
    );
  });

  it('dit pourquoi la liste manque quand le catalogue ne se charge pas', async () => {
    const page = await afficher('erreur');
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'La liste des contributeurs n’a pas pu être chargée.',
    );
  });
});
