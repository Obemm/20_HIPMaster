import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Carte } from './carte';
import { ILLUSTRATIONS_CARTES } from './illustrations';
import { VignetteCarte } from './vignette-carte';

const FTP: Carte = {
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
    { id: 'veteran', nom: 'Vétéran', description: 'Immunisé contre les cartes IA.' },
  ],
  enVrai: 'Transfert de fichiers en clair.',
};

const TIMEOUT: Carte = {
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
};

function afficher(carte: Carte, lien?: string[]) {
  const fixture = TestBed.createComponent(VignetteCarte);
  fixture.componentRef.setInput('carte', carte);
  if (lien) fixture.componentRef.setInput('lien', lien);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('VignetteCarte', () => {
  beforeEach(() => {
    // Sans illustration : la carte garde le pictogramme de sa famille (le manifeste réel en a pour toutes).
    TestBed.configureTestingModule({
      imports: [VignetteCarte],
      providers: [provideRouter([]), { provide: ILLUSTRATIONS_CARTES, useValue: {} }],
    });
  });

  it('affiche la rareté en toutes lettres, le coût, le nom et les statistiques nommées', () => {
    const carte = afficher(FTP);
    const texte = carte.textContent?.replaceAll(/\s+/g, ' ') ?? '';
    expect(carte.querySelector('article')?.classList).toContain('cadre-legendaire');
    expect(texte).toContain('★ Légendaire');
    expect(texte).toContain('Débit 3');
    expect(carte.querySelector('h2')?.textContent?.trim()).toBe('FTP');
    expect(texte).toContain('Composant · Fichiers & Batch');
    expect(texte).toContain('Attaque 5');
    expect(texte).toContain('PV 4');
  });

  it('résume les capacités quand la carte n’a pas d’effet propre, et son effet sinon', () => {
    expect(afficher(FTP).textContent).toContain('Batch · Vétéran');
    const incident = afficher(TIMEOUT);
    expect(incident.textContent).toContain('ne peut pas attaquer à son prochain tour');
    expect(incident.textContent).not.toContain('Attaque');
  });

  it('fait du nom un lien vers le détail seulement quand un lien est fourni', () => {
    expect(afficher(FTP).querySelector('a')).toBeNull();
    expect(afficher(FTP, ['/cartes', '1']).querySelector('h2 a')?.getAttribute('href')).toBe(
      '/cartes/1',
    );
  });

  it('cache aux lecteurs d’écran l’illustration et les icônes, purement décoratives', () => {
    const carte = afficher(FTP);
    for (const svg of carte.querySelectorAll('svg')) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('sans illustration, garde le fond et le pictogramme de la famille', () => {
    const carte = afficher(FTP);
    expect(carte.querySelector('img')).toBeNull();
    expect(carte.querySelector('[class*="from-amber-500"] svg')).not.toBeNull();
  });
});

describe('VignetteCarte avec une illustration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VignetteCarte],
      providers: [
        provideRouter([]),
        { provide: ILLUSTRATIONS_CARTES, useValue: { 1: 'Un vieux serveur de fichiers' } },
      ],
    });
  });

  it('affiche l’image optimisée, en AVIF puis WebP, avec son texte alternatif', () => {
    const carte = afficher(FTP);
    const sources = [...carte.querySelectorAll('picture source')];
    expect(sources.map((s) => s.getAttribute('type'))).toEqual(['image/avif', 'image/webp']);
    expect(sources[0]?.getAttribute('srcset')).toBe(
      '/cartes/set-1/1-320.avif 320w, /cartes/set-1/1-640.avif 640w',
    );
    const image = carte.querySelector('img');
    expect(image?.getAttribute('alt')).toBe('Un vieux serveur de fichiers');
    expect(image?.getAttribute('src')).toBe('/cartes/set-1/1-640.webp');
    expect(image?.getAttribute('loading')).toBe('lazy');
    expect(image?.getAttribute('width')).toBe('640');
    expect(image?.getAttribute('height')).toBe('480');
  });

  it('n’affiche plus le pictogramme de la famille, et ne touche pas aux cartes sans image', () => {
    expect(afficher(FTP).querySelector('[class*="from-amber-500"] svg')).toBeNull();
    expect(afficher(TIMEOUT).querySelector('img')).toBeNull();
  });

  it('rend l’illustration décorative quand la carte est dans un bouton, sans titre', () => {
    const fixture = TestBed.createComponent(VignetteCarte);
    fixture.componentRef.setInput('carte', FTP);
    fixture.componentRef.setInput('titre', false);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('img')?.getAttribute('alt')).toBe(
      '',
    );
  });
});
