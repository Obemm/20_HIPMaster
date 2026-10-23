import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CompteService } from '../compte/compte.service';
import {
  dateDans,
  echeance,
  type Invitation,
  type InvitationCreee,
  InviterEcran,
  usage,
} from './inviter';

const ADMIN = {
  id: '00000000-0000-4000-8000-000000000001',
  pseudo: 'Porteur',
  administrateur: true,
} as const;
const LISTE = '/api/v1/admin/invitations';

const invitation = (modifs: Partial<Invitation> = {}): Invitation => ({
  id: '00000000-0000-4000-8000-0000000000a1',
  libelle: 'Équipe intégration',
  utilisations: 3,
  utilisationsMax: 20,
  comptes: 3,
  creeLe: '2026-10-23T08:00:00.000Z',
  expireLe: '2027-01-01T00:00:00.000Z',
  revoqueeLe: null,
  statut: 'active',
  ...modifs,
});

describe('Inviter', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [InviterEcran],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** La page, pour ce joueur (un administrateur par défaut). */
  async function afficher(
    joueur: { id: string; pseudo: string; administrateur?: true } | null = ADMIN,
  ) {
    const compte = TestBed.inject(CompteService);
    compte.joueur.set(joueur);
    compte.pret.set(true);
    const fixture = TestBed.createComponent(InviterEcran);
    fixture.detectChanges();
    await fixture.whenStable();
    return {
      fixture,
      page: fixture.nativeElement as HTMLElement,
      http: TestBed.inject(HttpTestingController),
    };
  }

  async function rafraichir(fixture: {
    whenStable: () => Promise<unknown>;
    detectChanges: () => void;
  }) {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const bouton = (page: HTMLElement, texte: string) =>
    [...page.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte);

  const saisir = (page: HTMLElement, id: string, valeur: string) => {
    const champ = page.querySelector<HTMLInputElement>(`#${id}`);
    if (!champ) throw new Error(`champ ${id} absent`);
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
  };

  it('pour un joueur qui n’est pas administrateur, renvoie à l’accueil sans rien demander à l’API', async () => {
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { page, http } = await afficher({ id: ADMIN.id, pseudo: 'Ada' });
    expect(naviguer).toHaveBeenCalledWith('/', { replaceUrl: true });
    http.expectNone(LISTE);
    expect(page.textContent).not.toContain('Nouvelle invitation');
  });

  it('sans compte, renvoie aussi à l’accueil', async () => {
    const naviguer = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await afficher(null);
    expect(naviguer).toHaveBeenCalledWith('/', { replaceUrl: true });
  });

  it('liste les invitations avec leur usage, leur statut et leur échéance', async () => {
    const { fixture, page, http } = await afficher();
    http.expectOne(LISTE).flush({
      invitations: [
        invitation(),
        invitation({
          id: '00000000-0000-4000-8000-0000000000a2',
          libelle: 'Démo',
          utilisations: 0,
          utilisationsMax: 5,
          statut: 'revoquee',
          revoqueeLe: '2026-10-23T09:00:00.000Z',
        }),
      ],
    });
    await rafraichir(fixture);
    const elements = [...page.querySelectorAll('li')].map((li) =>
      li.textContent?.replace(/\s+/g, ' '),
    );
    expect(elements[0]).toContain('Équipe intégration');
    expect(elements[0]).toContain('Active');
    expect(elements[0]).toContain('3 comptes créés sur 20 · valable jusqu’au 31 décembre 2026');
    expect(elements[0]).toContain('Révoquer');
    expect(elements[1]).toContain('Révoquée');
    expect(elements[1]).toContain('Aucun compte créé sur 5 · révoquée le 23 octobre 2026');
    // Une invitation révoquée ne se révoque plus.
    expect(elements[1]).not.toContain('Révoquer');
  });

  it('crée une invitation, montre son lien une seule fois et le copie en un geste', async () => {
    const ecrire = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: ecrire } });
    const { fixture, page, http } = await afficher();
    http.expectOne(LISTE).flush({ invitations: [] });
    await rafraichir(fixture);
    expect(page.textContent).toContain('Aucune invitation pour l’instant.');

    saisir(page, 'libelle', '  Équipe intégration ');
    saisir(page, 'utilisations', '20');
    saisir(page, 'expire', '2026-12-31');
    fixture.detectChanges();
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    const creation = http.expectOne({ method: 'POST', url: LISTE });
    expect(creation.request.body).toEqual({
      libelle: 'Équipe intégration',
      utilisations: 20,
      expire: '2026-12-31',
    });
    const reponse: InvitationCreee = {
      invitation: invitation({ utilisations: 0, comptes: 0 }),
      code: 'ABCD-EFGH-JKLM-NPQR',
      lien: 'https://hipmaster.web.app/compte?invitation=ABCD-EFGH-JKLM-NPQR',
    };
    creation.flush(reponse, { status: 201, statusText: 'Created' });
    await rafraichir(fixture);
    expect(page.textContent).toContain('Invitation « Équipe intégration » créée');
    expect(page.querySelector<HTMLInputElement>('#lien-invitation')?.value).toBe(reponse.lien);
    expect(page.textContent).toContain('il ne sera plus jamais affiché');
    expect(page.querySelectorAll('li')).toHaveLength(1);
    expect(page.querySelector<HTMLInputElement>('#libelle')?.value).toBe('');

    bouton(page, 'Copier le lien')?.click();
    await rafraichir(fixture);
    expect(ecrire).toHaveBeenCalledWith(reponse.lien);
    expect(page.textContent).toContain('Lien copié.');

    bouton(page, 'C’est envoyé')?.click();
    await rafraichir(fixture);
    expect(page.textContent).not.toContain(reponse.code);
    expect(page.querySelector('#lien-invitation')).toBeNull();
  });

  it('propose le partage du téléphone (Web Share) quand il existe', async () => {
    const partager = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, share: partager });
    const { fixture, page, http } = await afficher();
    http.expectOne(LISTE).flush({ invitations: [] });
    saisir(page, 'libelle', 'Démo');
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    http.expectOne({ method: 'POST', url: LISTE }).flush(
      {
        invitation: invitation(),
        code: 'ABCD-EFGH-JKLM-NPQR',
        lien: 'https://hipmaster.web.app/compte?invitation=X',
      },
      { status: 201, statusText: 'Created' },
    );
    await rafraichir(fixture);
    bouton(page, 'Partager')?.click();
    expect(partager).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://hipmaster.web.app/compte?invitation=X' }),
    );
  });

  it('sans Web Share (ordinateur), pas de bouton « Partager »', async () => {
    vi.stubGlobal('navigator', { ...navigator, share: undefined });
    const { fixture, page, http } = await afficher();
    http.expectOne(LISTE).flush({ invitations: [] });
    saisir(page, 'libelle', 'Démo');
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    http.expectOne({ method: 'POST', url: LISTE }).flush(
      {
        invitation: invitation(),
        code: 'ABCD-EFGH-JKLM-NPQR',
        lien: 'https://hipmaster.web.app/compte?invitation=X',
      },
      { status: 201, statusText: 'Created' },
    );
    await rafraichir(fixture);
    expect(bouton(page, 'Copier le lien')).toBeDefined();
    expect(bouton(page, 'Partager')).toBeUndefined();
  });

  it('explique un refus de l’API (400)', async () => {
    const { fixture, page, http } = await afficher();
    http.expectOne(LISTE).flush({ invitations: [] });
    saisir(page, 'libelle', 'Démo');
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    http
      .expectOne({ method: 'POST', url: LISTE })
      .flush({ title: 'Invalide' }, { status: 400, statusText: 'Bad Request' });
    await rafraichir(fixture);
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('de 1 à 1000 comptes');
  });

  it('révoque une invitation après confirmation ; « Non » la garde', async () => {
    const { fixture, page, http } = await afficher();
    http.expectOne(LISTE).flush({ invitations: [invitation()] });
    await rafraichir(fixture);

    bouton(page, 'Révoquer')?.click();
    await rafraichir(fixture);
    expect(page.textContent).toContain('Révoquer « Équipe intégration » ?');
    bouton(page, 'Non, la garder')?.click();
    await rafraichir(fixture);
    expect(page.textContent).not.toContain('Révoquer « Équipe intégration » ?');
    http.expectNone(`${LISTE}/${invitation().id}/revocation`);

    bouton(page, 'Révoquer')?.click();
    await rafraichir(fixture);
    bouton(page, 'Oui, révoquer')?.click();
    http
      .expectOne({ method: 'POST', url: `${LISTE}/${invitation().id}/revocation` })
      .flush(invitation({ statut: 'revoquee', revoqueeLe: '2026-10-23T09:00:00.000Z' }));
    await rafraichir(fixture);
    expect(page.querySelector('li')?.textContent).toContain('Révoquée');
    expect(bouton(page, 'Révoquer')).toBeUndefined();
    expect(page.textContent).toContain(
      'Invitation « Équipe intégration » révoquée : son lien ne crée plus de compte',
    );
  });

  it('dit pourquoi la liste n’a pas pu être chargée, et la recharge', async () => {
    const { fixture, page, http } = await afficher();
    http.expectOne(LISTE).flush(null, { status: 503, statusText: 'Service Unavailable' });
    await rafraichir(fixture);
    expect(page.textContent).toContain('Les invitations n’ont pas pu être chargées.');
    bouton(page, 'Réessayer')?.click();
    http.expectOne(LISTE).flush({ invitations: [invitation()] });
    await rafraichir(fixture);
    expect(page.querySelectorAll('li')).toHaveLength(1);
  });
});

describe('textes de la page « Inviter »', () => {
  it('l’usage, au singulier comme au pluriel', () => {
    expect(usage({ utilisations: 0, utilisationsMax: 1 })).toBe('Aucun compte créé sur 1');
    expect(usage({ utilisations: 1, utilisationsMax: 5 })).toBe('1 compte créé sur 5');
    expect(usage({ utilisations: 4, utilisationsMax: 5 })).toBe('4 comptes créés sur 5');
  });

  it('l’échéance cite le dernier jour de validité, ou la date de révocation', () => {
    expect(echeance({ expireLe: '2027-01-01T00:00:00.000Z', revoqueeLe: null })).toBe(
      'valable jusqu’au 31 décembre 2026',
    );
    expect(
      echeance({ expireLe: '2026-10-23T09:00:00.000Z', revoqueeLe: '2026-10-23T09:00:00.000Z' }),
    ).toBe('révoquée le 23 octobre 2026');
  });

  it('une date de champ date, dans le fuseau du joueur', () => {
    expect(dateDans(30, new Date(2026, 9, 23, 12))).toBe('2026-11-22');
    expect(dateDans(0, new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});
