import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { bilanDeconnexion, CompteEcran } from './compte';
import { CompteService, intercepteurJeton } from './compte.service';

const JOUEUR = { id: '00000000-0000-4000-8000-000000000001', pseudo: 'Ada' };
const PANNE = { status: 503, statusText: 'Service Unavailable' };
const REFUS = { status: 401, statusText: 'Unauthorized' };

/** Une page qui demande un compte, d'où la session expire. */
@Component({ template: '<p>Ma collection</p>' })
class PageCollection {}

describe('Compte', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CompteEcran],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter(
          [
            { path: 'compte', component: CompteEcran },
            { path: 'collection', component: PageCollection },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
  });

  async function afficher() {
    const fixture = TestBed.createComponent(CompteEcran);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  const saisir = (page: HTMLElement, id: string, valeur: string) => {
    const champ = page.querySelector<HTMLInputElement>(`#${id}`);
    if (!champ) throw new Error(`champ ${id} absent`);
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
  };

  const bouton = (page: HTMLElement, texte: string) =>
    [...page.querySelectorAll('button')].find((b) => b.textContent?.includes(texte));

  it('crée un compte, garde le jeton et montre le code de récupération une seule fois', async () => {
    const { fixture, page } = await afficher();
    saisir(page, 'pseudo', ' Ada ');
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    const requete = TestBed.inject(HttpTestingController).expectOne('/api/v1/joueurs');
    expect(requete.request.body).toEqual({ pseudo: 'Ada' });
    requete.flush({ joueur: JOUEUR, jeton: 'jeton-1', codeRecuperation: 'ABCD-EFGH-JKLM' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('ABCD-EFGH-JKLM');
    expect(page.textContent).toContain('Connecté en tant que Ada');
    expect(localStorage.getItem('hipmaster.jeton')).toBe('jeton-1');

    bouton(page, 'C’est noté')?.click();
    fixture.detectChanges();
    expect(page.textContent).not.toContain('ABCD-EFGH-JKLM');
  });

  it('retrouve un compte avec son code, et explique un code inconnu', async () => {
    const { fixture, page } = await afficher();
    const http = TestBed.inject(HttpTestingController);
    saisir(page, 'code', 'zzzz-zzzz-zzzz');
    page.querySelectorAll<HTMLFormElement>('form')[1]?.requestSubmit();
    http
      .expectOne('/api/v1/sessions')
      .flush({ title: 'Code de récupération inconnu', status: 401 }, REFUS);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Code de récupération inconnu',
    );
    expect(page.textContent).not.toContain('Session expirée');

    page.querySelectorAll<HTMLFormElement>('form')[1]?.requestSubmit();
    http.expectOne('/api/v1/sessions').flush({ joueur: JOUEUR, jeton: 'jeton-2' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Connecté en tant que Ada');
  });

  it('après une récupération par code, revient à la page d’où l’on venait (un défi)', async () => {
    const { fixture, page } = await afficher();
    fixture.componentRef.setInput('retour', '/duels/abc');
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    saisir(page, 'code', 'ABCD-EFGH-JKLM');
    page.querySelectorAll<HTMLFormElement>('form')[1]?.requestSubmit();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/sessions')
      .flush({ joueur: JOUEUR, jeton: 'jeton-3' });
    await fixture.whenStable();
    expect(naviguer).toHaveBeenCalledWith('/duels/abc');
  });

  it('ne suit jamais un retour vers une autre adresse', async () => {
    const { fixture, page } = await afficher();
    fixture.componentRef.setInput('retour', '//exemple.com');
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    saisir(page, 'code', 'ABCD-EFGH-JKLM');
    page.querySelectorAll<HTMLFormElement>('form')[1]?.requestSubmit();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/sessions')
      .flush({ joueur: JOUEUR, jeton: 'jeton-4' });
    await fixture.whenStable();
    expect(naviguer).not.toHaveBeenCalled();
  });

  it('envoie le jeton à l’API, et l’oublie si l’API ne reconnaît plus la session', async () => {
    localStorage.setItem('hipmaster.jeton', 'jeton-ancien');
    const service = TestBed.inject(CompteService);
    const http = TestBed.inject(HttpTestingController);
    const chargement = service.charger();
    const moi = http.expectOne('/api/v1/moi');
    expect(moi.request.headers.get('Authorization')).toBe('Bearer jeton-ancien');
    moi.flush({ title: 'Compte requis', status: 401 }, REFUS);
    await chargement;
    expect(service.joueur()).toBeNull();
    expect(service.pret()).toBe(true);
    expect(service.expiree()).toBe(true);
    expect(localStorage.getItem('hipmaster.jeton')).toBeNull();

    void firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/cartes'));
    expect(http.expectOne('/api/v1/cartes').request.headers.has('Authorization')).toBe(false);
  });

  it('serveur injoignable : garde le compte, dit pourquoi avec « Réessayer », sans jamais proposer d’en créer un', async () => {
    localStorage.setItem('hipmaster.jeton', 'jeton-garde');
    const service = TestBed.inject(CompteService);
    const { fixture, page } = await afficher();
    expect(page.textContent).toContain('Vérification de votre session…');

    const http = TestBed.inject(HttpTestingController);
    const chargement = service.charger();
    http.expectOne('/api/v1/moi').flush(null, PANNE);
    await chargement;
    fixture.detectChanges();
    expect(service.pret()).toBe(false);
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Serveur injoignable');
    expect(page.textContent).toContain('votre compte reste gardé par ce navigateur');
    expect(page.querySelector('#pseudo')).toBeNull();
    expect(page.querySelector('#code')).toBeNull();
    expect(localStorage.getItem('hipmaster.jeton')).toBe('jeton-garde');

    bouton(page, 'Réessayer')?.click();
    fixture.detectChanges();
    expect(bouton(page, 'Nouvel essai…')?.disabled).toBe(true);
    http.expectOne('/api/v1/moi').flush(JOUEUR);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Connecté en tant que Ada');
  });

  it('revérifie seule une session non vérifiée, quelques fois, puis dès que le réseau revient', async () => {
    vi.useFakeTimers();
    try {
      localStorage.setItem('hipmaster.jeton', 'jeton-garde');
      const service = TestBed.inject(CompteService);
      const http = TestBed.inject(HttpTestingController);
      void service.charger();
      for (const delai of [5_000, 15_000, 45_000]) {
        http.expectOne('/api/v1/moi').flush(null, PANNE);
        await vi.advanceTimersByTimeAsync(delai - 1);
        http.expectNone('/api/v1/moi');
        await vi.advanceTimersByTimeAsync(1);
      }
      http.expectOne('/api/v1/moi').flush(null, { status: 429, statusText: 'Too Many Requests' });
      await vi.advanceTimersByTimeAsync(60 * 60_000);
      http.expectNone('/api/v1/moi');
      expect(service.jeton).toBe('jeton-garde');
      expect(service.pret()).toBe(false);

      globalThis.dispatchEvent(new Event('online'));
      http.expectOne('/api/v1/moi').flush(JOUEUR);
      await vi.advanceTimersByTimeAsync(0);
      expect(service.joueur()).toEqual(JOUEUR);
      expect(service.echec()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('ne crée ni ne retrouve jamais de compte par-dessus un jeton gardé, même non vérifié', async () => {
    localStorage.setItem('hipmaster.jeton', 'jeton-garde');
    const service = TestBed.inject(CompteService);
    await expect(service.creer('Bob')).rejects.toThrow('Un compte est déjà gardé');
    await expect(service.recuperer('ABCD-EFGH-JKLM')).rejects.toThrow('Un compte est déjà gardé');
    TestBed.inject(HttpTestingController).verify();
    expect(localStorage.getItem('hipmaster.jeton')).toBe('jeton-garde');
  });

  it('session expirée en cours de jeu : renvoie vers « Mon compte », puis ramène le joueur à sa page', async () => {
    localStorage.setItem('hipmaster.jeton', 'jeton-perime');
    const harnais = await RouterTestingHarness.create('/collection');
    const http = TestBed.inject(HttpTestingController);
    const routeur = TestBed.inject(Router);

    void firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/moi/collection')).catch(
      () => undefined,
    );
    http.expectOne('/api/v1/moi/collection').flush({ title: 'Compte requis', status: 401 }, REFUS);
    await vi.waitFor(() => expect(routeur.url).toBe('/compte?retour=%2Fcollection'));
    expect(localStorage.getItem('hipmaster.jeton')).toBeNull();

    await harnais.fixture.whenStable();
    harnais.detectChanges();
    const page = harnais.routeNativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Session expirée');
    saisir(page, 'code', 'ABCD-EFGH-JKLM');
    page.querySelectorAll<HTMLFormElement>('form')[1]?.requestSubmit();
    http.expectOne('/api/v1/sessions').flush({ joueur: JOUEUR, jeton: 'jeton-neuf' });
    await vi.waitFor(() => expect(routeur.url).toBe('/collection'));
    expect(TestBed.inject(CompteService).expiree()).toBe(false);
  });

  it('un 401 venu d’une ancienne session n’efface pas la nouvelle', async () => {
    localStorage.setItem('hipmaster.jeton', 'jeton-ancien');
    const service = TestBed.inject(CompteService);
    const http = TestBed.inject(HttpTestingController);
    void firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/moi/duels')).catch(() => undefined);
    const ancienne = http.expectOne('/api/v1/moi/duels');
    // Entre-temps, un autre onglet a ouvert une autre session.
    localStorage.setItem('hipmaster.jeton', 'jeton-neuf');
    globalThis.dispatchEvent(new StorageEvent('storage', { key: 'hipmaster.jeton' }));
    http.expectOne('/api/v1/moi').flush(JOUEUR);
    ancienne.flush({ title: 'Compte requis', status: 401 }, REFUS);
    await vi.waitFor(() => expect(service.joueur()).toEqual(JOUEUR));
    expect(service.jeton).toBe('jeton-neuf');
    expect(service.expiree()).toBe(false);
  });

  it('se déconnecter d’une session déjà fermée n’annonce pas de session expirée', async () => {
    localStorage.setItem('hipmaster.jeton', 'jeton-ferme');
    const service = TestBed.inject(CompteService);
    const deconnexion = service.deconnecter();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/sessions/courante')
      .flush({ title: 'Compte requis', status: 401 }, REFUS);
    await expect(deconnexion).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(service.jeton).toBeNull();
    expect(service.expiree()).toBe(false);
  });

  it('suit une déconnexion, puis une connexion, faites dans un autre onglet', async () => {
    localStorage.setItem('hipmaster.jeton', 'jeton-1');
    const service = TestBed.inject(CompteService);
    const http = TestBed.inject(HttpTestingController);
    const chargement = service.charger();
    http.expectOne('/api/v1/moi').flush(JOUEUR);
    await chargement;

    localStorage.removeItem('hipmaster.jeton');
    globalThis.dispatchEvent(new StorageEvent('storage', { key: 'hipmaster.jeton' }));
    expect(service.joueur()).toBeNull();
    expect(service.jeton).toBeNull();
    expect(service.pret()).toBe(true);

    localStorage.setItem('hipmaster.jeton', 'jeton-2');
    globalThis.dispatchEvent(new StorageEvent('storage', { key: 'hipmaster.jeton' }));
    expect(service.pret()).toBe(false);
    const moi = http.expectOne('/api/v1/moi');
    expect(moi.request.headers.get('Authorization')).toBe('Bearer jeton-2');
    moi.flush({ ...JOUEUR, pseudo: 'Bob' });
    await vi.waitFor(() => expect(service.joueur()?.pseudo).toBe('Bob'));
  });

  /** La page, avec une session vérifiée pour Ada. */
  async function afficherConnecte() {
    localStorage.setItem('hipmaster.jeton', 'jeton-1');
    const service = TestBed.inject(CompteService);
    const affichage = await afficher();
    const chargement = service.charger();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/moi').flush(JOUEUR);
    await chargement;
    affichage.fixture.detectChanges();
    return affichage;
  }

  it('un nouveau code dit que les autres appareils ont été déconnectés (US-047)', async () => {
    const { fixture, page } = await afficherConnecte();
    expect(page.textContent).toContain('vos autres appareils seront déconnectés');
    bouton(page, 'Générer un nouveau code')?.click();
    TestBed.inject(HttpTestingController)
      .expectOne({ method: 'POST', url: '/api/v1/moi/code' })
      .flush({ codeRecuperation: 'WXYZ-2345-6789', sessionsFermees: 2 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('WXYZ-2345-6789');
    const annonces = [...page.querySelectorAll('[role="status"]')].map((e) => e.textContent);
    expect(annonces).toContain('Vos 2 autres appareils ont été déconnectés.');
  });

  it('« Déconnecter mes autres appareils » garde cet appareil connecté et dit le bilan (US-047)', async () => {
    const { fixture, page } = await afficherConnecte();
    bouton(page, 'Déconnecter mes autres appareils')?.click();
    const requete = TestBed.inject(HttpTestingController).expectOne('/api/v1/sessions/autres');
    expect(requete.request.method).toBe('DELETE');
    expect(requete.request.headers.get('Authorization')).toBe('Bearer jeton-1');
    requete.flush({ sessionsFermees: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    const annonces = [...page.querySelectorAll('[role="status"]')].map((e) => e.textContent);
    expect(annonces).toContain('Votre autre appareil a été déconnecté.');
    expect(page.textContent).toContain('Connecté en tant que Ada');
    expect(localStorage.getItem('hipmaster.jeton')).toBe('jeton-1');
  });

  it('supprime le compte après confirmation, puis le dit et oublie le jeton (US-053)', async () => {
    const { fixture, page } = await afficherConnecte();
    const http = TestBed.inject(HttpTestingController);
    bouton(page, 'Supprimer mon compte…')?.click();
    fixture.detectChanges();
    // Rien ne part avant la confirmation, et l'on peut se raviser.
    http.expectNone('/api/v1/moi');
    bouton(page, 'Non, le garder')?.click();
    fixture.detectChanges();
    expect(bouton(page, 'Oui, supprimer mon compte')).toBeUndefined();

    bouton(page, 'Supprimer mon compte…')?.click();
    fixture.detectChanges();
    bouton(page, 'Oui, supprimer mon compte')?.click();
    const requete = http.expectOne({ method: 'DELETE', url: '/api/v1/moi' });
    expect(requete.request.headers.get('Authorization')).toBe('Bearer jeton-1');
    requete.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Votre compte a été supprimé');
    expect(page.textContent).toContain('Créer mon compte');
    expect(localStorage.getItem('hipmaster.jeton')).toBeNull();
  });

  it('une suppression qui échoue garde le compte et le dit (US-053)', async () => {
    const { fixture, page } = await afficherConnecte();
    bouton(page, 'Supprimer mon compte…')?.click();
    fixture.detectChanges();
    bouton(page, 'Oui, supprimer mon compte')?.click();
    TestBed.inject(HttpTestingController)
      .expectOne({ method: 'DELETE', url: '/api/v1/moi' })
      .flush(null, PANNE);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toBeTruthy();
    expect(page.textContent).toContain('Connecté en tant que Ada');
    expect(localStorage.getItem('hipmaster.jeton')).toBe('jeton-1');
  });

  it('une session refusée en déconnectant les autres appareils est une session expirée', async () => {
    const { fixture, page } = await afficherConnecte();
    bouton(page, 'Déconnecter mes autres appareils')?.click();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/sessions/autres')
      .flush({ title: 'Compte requis', status: 401 }, REFUS);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(CompteService).expiree()).toBe(true);
    expect(localStorage.getItem('hipmaster.jeton')).toBeNull();
    expect(page.textContent).toContain('Session expirée');
  });

  it('dit combien d’appareils ont été déconnectés, accordé au nombre', () => {
    expect(bilanDeconnexion(0)).toBe('Aucun autre appareil n’était connecté.');
    expect(bilanDeconnexion(1)).toBe('Votre autre appareil a été déconnecté.');
    expect(bilanDeconnexion(3)).toBe('Vos 3 autres appareils ont été déconnectés.');
  });

  it('un lien d’invitation remplit le code, envoyé avec le pseudo (US-048)', async () => {
    const { fixture, page } = await afficher();
    fixture.componentRef.setInput('invitation', ' abcd-efgh-jklm-npqr ');
    fixture.detectChanges();
    expect(page.querySelector<HTMLInputElement>('#invitation')?.value).toBe('abcd-efgh-jklm-npqr');
    saisir(page, 'pseudo', 'Ada');
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    const requete = TestBed.inject(HttpTestingController).expectOne('/api/v1/joueurs');
    expect(requete.request.body).toEqual({ pseudo: 'Ada', invitation: 'abcd-efgh-jklm-npqr' });
    requete.flush({ joueur: JOUEUR, jeton: 'jeton-5', codeRecuperation: 'ABCD-EFGH-JKLM' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Connecté en tant que Ada');
  });

  it('explique une invitation refusée (403), sans créer de compte', async () => {
    const { fixture, page } = await afficher();
    saisir(page, 'pseudo', 'Ada');
    saisir(page, 'invitation', 'ZZZZ-ZZZZ-ZZZZ-ZZZZ');
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/joueurs')
      .flush(
        { title: 'Invitation refusée : code absent, inconnu, expiré ou épuisé', status: 403 },
        { status: 403, statusText: 'Forbidden' },
      );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Ce code d’invitation n’est pas accepté',
    );
    expect(localStorage.getItem('hipmaster.jeton')).toBeNull();
    expect(page.querySelector<HTMLInputElement>('#invitation')?.value).toBe('ZZZZ-ZZZZ-ZZZZ-ZZZZ');
  });

  it('montre « Inviter des collègues » à l’administrateur seulement, et l’identifiant du compte à tous (US-072)', async () => {
    const compte = TestBed.inject(CompteService);
    compte.joueur.set(JOUEUR);
    compte.pret.set(true);
    const { fixture, page } = await afficher();
    const lienInviter = () =>
      [...page.querySelectorAll('a')].find((a) => a.textContent?.includes('Inviter'));
    expect(lienInviter()).toBeUndefined();
    expect(page.querySelector('details')?.textContent).toContain(JOUEUR.id);

    compte.joueur.set({ ...JOUEUR, administrateur: true });
    fixture.detectChanges();
    expect(lienInviter()?.getAttribute('href')).toBe('/inviter');
  });
});
