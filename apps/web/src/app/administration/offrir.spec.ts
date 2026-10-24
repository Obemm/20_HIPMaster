import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CompteService } from '../compte/compte.service';
import {
  type CodeBoosters,
  type CodeBoostersCree,
  echeanceCode,
  OffrirEcran,
  usageCode,
} from './offrir';

const ADMIN = {
  id: '00000000-0000-4000-8000-000000000001',
  pseudo: 'Porteur',
  administrateur: true,
} as const;
const LISTE = '/api/v1/admin/codes-boosters';

const codeBoosters = (modifs: Partial<CodeBoosters> = {}): CodeBoosters => ({
  id: '00000000-0000-4000-8000-0000000000b1',
  libelle: '1re API publiée',
  boosters: 3,
  utilisations: 1,
  utilisationsMax: 5,
  creeLe: '2026-10-24T08:00:00.000Z',
  expireLe: '2027-01-01T00:00:00.000Z',
  revoqueLe: null,
  statut: 'actif',
  ...modifs,
});

describe('Offrir des boosters', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [OffrirEcran],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function afficher(
    joueur: { id: string; pseudo: string; administrateur?: true } | null = ADMIN,
  ) {
    const compte = TestBed.inject(CompteService);
    compte.joueur.set(joueur);
    compte.pret.set(true);
    const fixture = TestBed.createComponent(OffrirEcran);
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
    expect(page.textContent).not.toContain('Nouveau code');
  });

  it('crée un code avec ses réglages, montre son lien une seule fois et le copie', async () => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: ecrire } });
    const { fixture, page, http } = await afficher();
    http.expectOne(LISTE).flush({ codes: [] });
    await rafraichir(fixture);
    expect(page.textContent).toContain('Aucun code pour l’instant.');

    saisir(page, 'libelle', '  1re API publiée ');
    saisir(page, 'boosters', '3');
    saisir(page, 'utilisations', '5');
    saisir(page, 'expire', '2026-12-31');
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    const creation = http.expectOne({ method: 'POST', url: LISTE });
    expect(creation.request.body).toEqual({
      libelle: '1re API publiée',
      boosters: 3,
      utilisations: 5,
      expire: '2026-12-31',
    });
    const cree: CodeBoostersCree = {
      codeBoosters: codeBoosters({ utilisations: 0 }),
      code: 'ABCD-EFGH-JKLM-NPQR',
      lien: 'https://hipmaster.web.app/boosters?code=ABCD-EFGH-JKLM-NPQR',
    };
    creation.flush(cree);
    await rafraichir(fixture);
    expect(page.querySelector<HTMLInputElement>('#lien-code')?.value).toBe(cree.lien);
    expect(page.textContent).toContain('3 boosters par joueur · Personne sur 5');
    expect(page.textContent).toContain('Code « 1re API publiée » créé');

    bouton(page, 'Copier le lien')?.click();
    await rafraichir(fixture);
    expect(ecrire).toHaveBeenCalledWith(cree.lien);
    expect(page.textContent).toContain('Lien copié.');

    bouton(page, 'C’est envoyé')?.click();
    await rafraichir(fixture);
    expect(page.querySelector('#lien-code')).toBeNull();
    expect(page.textContent).not.toContain(cree.code);
  });

  it('explique un refus de l’API (400)', async () => {
    const { fixture, page, http } = await afficher();
    http.expectOne(LISTE).flush({ codes: [] });
    await rafraichir(fixture);
    saisir(page, 'libelle', 'Démo');
    page.querySelector<HTMLFormElement>('form')?.requestSubmit();
    http
      .expectOne({ method: 'POST', url: LISTE })
      .flush({ title: 'Corps invalide' }, { status: 400, statusText: 'Bad Request' });
    await rafraichir(fixture);
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('de 1 à 20 boosters');
  });

  it('montre qui a utilisé un code, puis le révoque après confirmation', async () => {
    const { fixture, page, http } = await afficher();
    const code = codeBoosters();
    http.expectOne(LISTE).flush({ codes: [code] });
    await rafraichir(fixture);

    page
      .querySelector<HTMLButtonElement>('[aria-label="Qui l’a utilisé ? « 1re API publiée »"]')
      ?.click();
    http.expectOne(`${LISTE}/${code.id}/beneficiaires`).flush({
      beneficiaires: [
        { joueurId: ADMIN.id, pseudo: 'Ada', boosters: 3, recuLe: '2026-10-24T09:00:00.000Z' },
      ],
    });
    await rafraichir(fixture);
    expect(
      page.querySelector('[aria-label="Bénéficiaires de « 1re API publiée »"]')?.textContent,
    ).toContain('Ada');

    page.querySelector<HTMLButtonElement>('[aria-label="Révoquer « 1re API publiée »"]')?.click();
    await rafraichir(fixture);
    bouton(page, 'Oui, révoquer')?.click();
    http
      .expectOne({ method: 'POST', url: `${LISTE}/${code.id}/revocation` })
      .flush(codeBoosters({ statut: 'revoque', revoqueLe: '2026-10-24T10:00:00.000Z' }));
    await rafraichir(fixture);
    expect(page.querySelector('[role="status"]')?.textContent).toContain(
      'Code « 1re API publiée » révoqué',
    );
    expect(page.textContent).toContain('Révoqué');
    expect(page.querySelector('[aria-label="Révoquer « 1re API publiée »"]')).toBeNull();
  });

  it('l’usage et l’échéance d’un code, au singulier comme au pluriel', () => {
    expect(usageCode({ boosters: 1, utilisations: 1, utilisationsMax: 1 })).toBe(
      '1 booster par joueur · 1 joueur sur 1',
    );
    expect(usageCode({ boosters: 2, utilisations: 3, utilisationsMax: 10 })).toBe(
      '2 boosters par joueur · 3 joueurs sur 10',
    );
    expect(echeanceCode({ expireLe: '2027-01-01T00:00:00.000Z', revoqueLe: null })).toBe(
      'valable jusqu’au 31 décembre 2026',
    );
    expect(
      echeanceCode({ expireLe: '2026-10-24T12:00:00.000Z', revoqueLe: '2026-10-24T12:00:00.000Z' }),
    ).toBe('révoqué le 24 octobre 2026');
  });
});
