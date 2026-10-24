import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { expliquer } from '../reseau/reseau';
import { dateDans } from './inviter';

/** Un code de boosters, tel que l'API le montre à un administrateur : jamais le code (contrat administration.yaml). */
export interface CodeBoosters {
  id: string;
  libelle: string;
  boosters: number;
  utilisations: number;
  utilisationsMax: number;
  creeLe: string;
  expireLe: string;
  revoqueLe: string | null;
  statut: 'actif' | 'epuise' | 'expire' | 'revoque';
}

/** La réponse à une création : le code et le lien, renvoyés cette seule fois. */
export interface CodeBoostersCree {
  codeBoosters: CodeBoosters;
  code: string;
  lien: string;
}

export interface Beneficiaire {
  joueurId: string;
  pseudo: string;
  boosters: number;
  recuLe: string;
}

export const LIBELLES_STATUT_CODE: Record<CodeBoosters['statut'], string> = {
  actif: 'Actif',
  epuise: 'Épuisé',
  expire: 'Expiré',
  revoque: 'Révoqué',
};

const dateLongue = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' });
const dateLocale = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const dateHeure = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

/** « 3 boosters par joueur · 2 joueurs sur 10 », « 1 booster par joueur · Personne sur 5 ». */
export function usageCode(
  code: Pick<CodeBoosters, 'boosters' | 'utilisations' | 'utilisationsMax'>,
): string {
  const { boosters, utilisations, utilisationsMax } = code;
  const parJoueur = `${pluriel(boosters, 'booster', 'boosters')} par joueur`;
  const joueurs = utilisations === 0 ? 'Personne' : pluriel(utilisations, 'joueur', 'joueurs');
  return `${parJoueur} · ${joueurs} sur ${utilisationsMax}`;
}

/** « valable jusqu'au 31 décembre 2026 », ou « révoqué le 24 octobre 2026 » : le dernier jour, minuit UTC exclu. */
export function echeanceCode(code: Pick<CodeBoosters, 'expireLe' | 'revoqueLe'>): string {
  if (code.revoqueLe) return `révoqué le ${dateLocale.format(new Date(code.revoqueLe))}`;
  return `valable jusqu’au ${dateLongue.format(new Date(Date.parse(code.expireLe) - 1))}`;
}

/**
 * Page « Offrir des boosters » (US-070, ADR 0045), sœur de « Inviter » et réservée aux administrateurs : récompenser
 * une réussite de l'équipe par un code, copier ou partager son lien, voir qui l'a utilisé, révoquer un code qui a fui.
 * Pour tout autre joueur, elle renvoie à l'accueil, et l'API répond 404 à ses routes : c'est le serveur qui fait foi.
 */
@Component({
  selector: 'hip-offrir',
  imports: [RouterLink, EtatSession, ErreurChargement],
  templateUrl: './offrir.html',
})
export class OffrirEcran {
  protected readonly compte = inject(CompteService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly injecteur = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly administrateur = computed(() => this.compte.joueur()?.administrateur === true);

  protected readonly libelle = signal('');
  protected readonly boosters = signal('3');
  protected readonly utilisations = signal('1');
  protected readonly expire = signal(dateDans(30));
  protected readonly aujourdhui = dateDans(0);

  /** Le code qui vient d'être créé, avec son lien (montrés cette seule fois). */
  protected readonly cree = signal<CodeBoostersCree | null>(null);
  protected readonly codes = signal<CodeBoosters[] | null>(null);
  protected readonly panne = signal<unknown>(null);
  protected readonly enLecture = signal(false);
  /** Les bénéficiaires affichés, par code. */
  protected readonly beneficiaires = signal<ReadonlyMap<string, Beneficiaire[]>>(new Map());
  protected readonly aRevoquer = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly occupe = signal(false);
  protected readonly copie = signal(false);
  protected readonly partageDisponible = typeof navigator.share === 'function';

  protected readonly statut = LIBELLES_STATUT_CODE;
  protected readonly usage = usageCode;
  protected readonly echeance = echeanceCode;
  protected readonly dateHeure = (date: string) => dateHeure.format(new Date(date));

  constructor() {
    // Sans compte d'administrateur, retour à l'accueil, comme pour une page qui n'existe pas.
    effect(() => {
      if (!this.compte.pret()) return;
      if (this.administrateur()) untracked(() => void this.charger());
      else void this.router.navigateByUrl('/', { replaceUrl: true });
    });
  }

  protected async charger(): Promise<void> {
    this.enLecture.set(true);
    try {
      const reponse = await firstValueFrom(
        this.http.get<{ codes: CodeBoosters[] }>('/api/v1/admin/codes-boosters'),
      );
      this.codes.set(reponse.codes);
      this.panne.set(null);
    } catch (erreur) {
      this.panne.set(erreur);
    } finally {
      this.enLecture.set(false);
    }
  }

  protected async creer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    await this.agir(async () => {
      const cree = await firstValueFrom(
        this.http.post<CodeBoostersCree>('/api/v1/admin/codes-boosters', {
          libelle: this.libelle().trim(),
          boosters: Number(this.boosters()),
          utilisations: Number(this.utilisations()),
          expire: this.expire(),
        }),
      );
      this.cree.set(cree);
      this.codes.update((liste) => [cree.codeBoosters, ...(liste ?? [])]);
      this.libelle.set('');
      this.focaliser('titre-cree');
    });
  }

  protected async copier(lien: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(lien);
      this.copie.set(true);
    } catch {
      this.copie.set(false);
    }
  }

  protected async partager(cree: CodeBoostersCree): Promise<void> {
    try {
      await navigator.share({
        title: 'Des boosters HIPMaster',
        text: `Bravo : « ${cree.codeBoosters.libelle} » ! Des boosters HIPMaster vous attendent avec ce lien.`,
        url: cree.lien,
      });
    } catch {
      // Partage annulé, ou refusé par le navigateur : « Copier le lien » reste là.
    }
  }

  protected oublierLien(): void {
    this.cree.set(null);
    this.copie.set(false);
    this.focaliser('titre-nouveau');
  }

  /** Montre ou cache les joueurs qui ont utilisé ce code (relus à chaque ouverture). */
  protected async basculerBeneficiaires(code: CodeBoosters): Promise<void> {
    if (this.beneficiaires().has(code.id)) {
      this.beneficiaires.update((m) => new Map([...m].filter(([id]) => id !== code.id)));
      return;
    }
    await this.agir(async () => {
      const reponse = await firstValueFrom(
        this.http.get<{ beneficiaires: Beneficiaire[] }>(
          `/api/v1/admin/codes-boosters/${code.id}/beneficiaires`,
        ),
      );
      this.beneficiaires.update((m) => new Map(m).set(code.id, reponse.beneficiaires));
    });
  }

  protected demanderRevocation(id: string): void {
    this.aRevoquer.set(id);
    this.focaliser(`garder-${id}`);
  }

  protected annulerRevocation(id: string): void {
    this.aRevoquer.set(null);
    this.focaliser(`revoquer-${id}`);
  }

  protected async revoquer(code: CodeBoosters): Promise<void> {
    await this.agir(async () => {
      const revoque = await firstValueFrom(
        this.http.post<CodeBoosters>(`/api/v1/admin/codes-boosters/${code.id}/revocation`, {}),
      );
      this.codes.update((liste) => (liste ?? []).map((c) => (c.id === revoque.id ? revoque : c)));
      if (this.cree()?.codeBoosters.id === revoque.id) this.cree.set(null);
      this.info.set(
        `Code « ${revoque.libelle} » révoqué : il n’offre plus de booster ; les boosters déjà reçus restent.`,
      );
      this.focaliser(`code-${revoque.id}`);
    });
    this.aRevoquer.set(null);
  }

  /** Lance une action ; un refus de l'API affiche le message prévu pour son statut, une panne sa cause. */
  private async agir(action: () => Promise<void>): Promise<void> {
    this.occupe.set(true);
    this.erreur.set(null);
    this.info.set(null);
    this.copie.set(false);
    try {
      await action();
    } catch (erreur) {
      const statut = erreur instanceof HttpErrorResponse ? erreur.status : 0;
      const messages: Partial<Record<number, string>> = {
        400:
          'Code refusé : une réussite de 1 à 80 caractères, de 1 à 20 boosters, de 1 à 1000 joueurs, ' +
          'et une date limite à partir d’aujourd’hui.',
        404: 'Ce code n’est plus en cours, ou ce compte n’est plus administrateur.',
      };
      this.erreur.set(messages[statut] ?? expliquer(erreur));
    } finally {
      this.occupe.set(false);
    }
  }

  /** Après le prochain rendu, le focus va à cet élément : le clavier ne se perd pas quand un bloc disparaît. */
  private focaliser(id: string): void {
    afterNextRender(() => this.document.getElementById(id)?.focus(), {
      injector: this.injecteur,
    });
  }
}
