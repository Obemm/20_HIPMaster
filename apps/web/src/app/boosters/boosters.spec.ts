import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import { annonceRecus, BoostersEcran } from './boosters';

const carte = (numero: number, nom: string): Carte => ({
  numero,
  nom,
  famille: 'fichiers',
  type: 'composant',
  rarete: 'commune',
  cout: 1,
  attaque: 1,
  pv: 1,
  capacites: [],
  enVrai: '',
});
const CATALOGUE = [1, 2, 3, 4, 5].map((n) => carte(n, `Carte ${n}`));

describe('Boosters', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [BoostersEcran],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
  });

  const bouton = (page: HTMLElement, texte: string) =>
    [...page.querySelectorAll('button')].find((b) => b.textContent?.includes(texte));

  async function afficher(connecte: boolean, code?: string) {
    const compte = TestBed.inject(CompteService);
    if (connecte) compte.joueur.set({ id: 'x', pseudo: 'Ada' });
    else compte.pret.set(true);
    const fixture = TestBed.createComponent(BoostersEcran);
    if (code !== undefined) fixture.componentRef.setInput('code', code);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    // Les chances par booster, en bas de l'écran (US-061) : testées dans chances-booster.spec.ts.
    http.expectOne('/api/v1/raretes').flush([]);
    return { fixture, http, page: fixture.nativeElement as HTMLElement };
  }

  it('invite à créer un compte quand on n’en a pas', async () => {
    const { fixture, page } = await afficher(false);
    await fixture.whenStable();
    expect(page.textContent).toContain('il faut un compte');
    expect(page.querySelector('a[href="/compte"]')).not.toBeNull();
  });

  it('montre le stock et la prochaine recharge, puis révèle les 5 cartes en signalant les nouvelles', async () => {
    const { fixture, http, page } = await afficher(true);
    fixture.detectChanges();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 5, plafond: 10, prochainDans: 125 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('5 boosters en stock');
    expect(page.textContent).toContain('Prochain booster gratuit dans 2 min 5 s');

    page.querySelector<HTMLButtonElement>('button')?.click();
    const ouverture = http.expectOne('/api/v1/moi/boosters/ouvertures');
    expect(ouverture.request.method).toBe('POST');
    ouverture.flush({
      cartes: [
        { numero: 1, nouvelle: true },
        { numero: 2, nouvelle: false },
        { numero: 3, nouvelle: true },
        { numero: 1, nouvelle: false },
        { numero: 5, nouvelle: false },
      ],
      boosters: { stock: 4, plafond: 10, prochainDans: 125 },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    // Les cartes arrivent face cachée (US-062) : rien n'est dit des nouvelles avant de les retourner.
    expect(page.textContent).toContain('Votre booster : 5 cartes à retourner');
    expect(page.querySelectorAll('hip-vignette-carte')).toHaveLength(0);
    expect(page.querySelectorAll('button.carte-cachee')).toHaveLength(5);
    expect(page.textContent).not.toContain('Nouvelle !');
    expect(page.textContent).toContain('4 boosters en stock');

    bouton(page, 'Tout révéler')?.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('Votre booster : 5 cartes, 2 nouvelles');
    expect(page.querySelectorAll('hip-vignette-carte')).toHaveLength(5);
    expect(page.textContent?.match(/Nouvelle !/g)).toHaveLength(2);
    expect(bouton(page, 'Tout révéler')).toBeUndefined();
  });

  it('retourne les cartes une à une : rareté au dos, carte annoncée, focus sur la suivante (US-062)', async () => {
    const { fixture, http, page } = await afficher(true);
    fixture.detectChanges();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 1, plafond: 10, prochainDans: 125 });
    await fixture.whenStable();
    fixture.detectChanges();
    bouton(page, 'Ouvrir un booster')?.click();
    http.expectOne('/api/v1/moi/boosters/ouvertures').flush({
      cartes: [
        { numero: 1, nouvelle: true },
        { numero: 2, nouvelle: false },
      ],
      boosters: { stock: 0, plafond: 10, prochainDans: 125 },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const cachees = page.querySelectorAll<HTMLButtonElement>('button.carte-cachee');
    expect(cachees[0]?.textContent?.replaceAll(/\s+/g, ' ').trim()).toBe(
      'Retourner la carte 1 : ● Commune',
    );
    expect(cachees[0]?.classList).toContain('cadre-commune');

    cachees[0]?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(page.querySelectorAll('hip-vignette-carte')).toHaveLength(1);
    expect(page.querySelector('[role="status"]')?.textContent).toBe(
      'Carte 1 : Carte 1, commune, nouvelle !',
    );
    expect(document.activeElement?.id).toBe('carte-cachee-1');
    expect(page.textContent).toContain('à retourner');

    page.querySelector<HTMLButtonElement>('#carte-cachee-1')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(page.textContent).toContain('Votre booster : 2 cartes, 1 nouvelle');
    expect(document.activeElement?.id).toBe('titre-tirage');
  });

  it('sans le catalogue, n’ouvre rien : bouton désactivé, raison et « Réessayer » (US-055)', async () => {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
    const fixture = TestBed.createComponent(BoostersEcran);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('/api/v1/cartes')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    http.expectOne('/api/v1/raretes').flush([]);
    fixture.detectChanges();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 5, plafond: 10, prochainDans: 125 });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(bouton(page, 'Ouvrir un booster')?.disabled).toBe(true);
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Les cartes n’ont pas pu être chargées',
    );

    bouton(page, 'Réessayer')?.click();
    TestBed.tick();
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(bouton(page, 'Ouvrir un booster')?.disabled).toBe(false);
  });

  it('dit pourquoi le stock n’a pas pu être lu, et le relit quand on réessaie', async () => {
    const { fixture, http, page } = await afficher(true);
    fixture.detectChanges();
    http.expectOne('/api/v1/moi/boosters').flush(null, { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Votre stock de boosters n’a pas pu être lu. Le serveur a rencontré un problème',
    );
    expect(page.textContent).not.toContain('Lecture de votre stock');

    bouton(page, 'Réessayer')?.click();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 2, plafond: 10, prochainDans: null });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('2 boosters en stock');
    expect(page.querySelector('[role="alert"]')).toBeNull();
  });

  it('désactive l’ouverture quand le stock est vide', async () => {
    const { fixture, http, page } = await afficher(true);
    fixture.detectChanges();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 0, plafond: 10, prochainDans: 30 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector<HTMLButtonElement>('button')?.disabled).toBe(true);
    expect(page.textContent).toContain('0 booster en stock');
  });

  describe('code cadeau (US-070)', () => {
    const saisir = (page: HTMLElement, valeur: string) => {
      const champ = page.querySelector<HTMLInputElement>('#code-boosters');
      if (!champ) throw new Error('champ du code absent');
      champ.value = valeur;
      champ.dispatchEvent(new Event('input'));
    };
    const formulaire = (page: HTMLElement) =>
      page.querySelector<HTMLFormElement>('#code-boosters')?.closest('form');

    it('un lien remplit le champ et le code quitte l’adresse ; les boosters reçus s’ajoutent au stock', async () => {
      const naviguer = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const { fixture, http, page } = await afficher(true, 'ABCD-EFGH-JKLM-NPQR');
      http.expectOne('/api/v1/moi/boosters').flush({ stock: 9, plafond: 10, prochainDans: 60 });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(page.querySelector<HTMLInputElement>('#code-boosters')?.value).toBe(
        'ABCD-EFGH-JKLM-NPQR',
      );
      expect(naviguer).toHaveBeenCalledWith([], { queryParams: { code: null }, replaceUrl: true });

      formulaire(page)?.requestSubmit();
      const requete = http.expectOne('/api/v1/moi/boosters/codes');
      expect(requete.request.method).toBe('POST');
      expect(requete.request.body).toEqual({ code: 'ABCD-EFGH-JKLM-NPQR' });
      requete.flush({
        libelle: '1re API publiée',
        offerts: 3,
        boosters: { stock: 12, plafond: 10, prochainDans: null },
      });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(page.textContent).toContain('12 boosters en stock');
      expect(page.textContent).toContain('« 1re API publiée » : 3 boosters offerts !');
      expect(page.querySelector<HTMLInputElement>('#code-boosters')?.value).toBe('');
    });

    it('dit qu’un code est refusé, sans dire pourquoi', async () => {
      const { fixture, http, page } = await afficher(true);
      http.expectOne('/api/v1/moi/boosters').flush({ stock: 1, plafond: 10, prochainDans: 60 });
      await fixture.whenStable();
      fixture.detectChanges();
      saisir(page, 'XXXX-XXXX-XXXX-XXXX');
      fixture.detectChanges();
      formulaire(page)?.requestSubmit();
      http
        .expectOne('/api/v1/moi/boosters/codes')
        .flush({ title: 'Refusé' }, { status: 403, statusText: 'Forbidden' });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(page.querySelector('[role="alert"]')?.textContent).toContain(
        'Ce code ne donne pas de booster',
      );
      expect(page.textContent).toContain('1 booster en stock');
    });

    it('sans compte, un lien de boosters invite à se connecter puis à rouvrir le lien', async () => {
      const { fixture, page } = await afficher(false, 'ABCD-EFGH-JKLM-NPQR');
      await fixture.whenStable();
      fixture.detectChanges();
      expect(page.textContent).toContain('Un code cadeau vous attend');
      expect(page.querySelector('#code-boosters')).toBeNull();
    });

    it('l’annonce, au singulier comme au pluriel', () => {
      expect(annonceRecus({ libelle: 'Démo', offerts: 1 })).toContain('1 booster offert !');
      expect(annonceRecus({ libelle: 'Démo', offerts: 2 })).toContain('2 boosters offerts !');
    });
  });
});
