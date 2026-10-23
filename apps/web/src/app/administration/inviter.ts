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

/** Une invitation, telle que l'API la montre à un administrateur : jamais son code (contrat administration.yaml). */
export interface Invitation {
  id: string;
  libelle: string;
  utilisations: number;
  utilisationsMax: number;
  comptes: number;
  creeLe: string;
  expireLe: string;
  revoqueeLe: string | null;
  statut: 'active' | 'epuisee' | 'expiree' | 'revoquee';
}

/** La réponse à une création : le code et le lien, renvoyés cette seule fois. */
export interface InvitationCreee {
  invitation: Invitation;
  code: string;
  lien: string;
}

export const LIBELLES_STATUT: Record<Invitation['statut'], string> = {
  active: 'Active',
  epuisee: 'Épuisée',
  expiree: 'Expirée',
  revoquee: 'Révoquée',
};

const JOUR_MS = 24 * 60 * 60 * 1000;
const dateLongue = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' });
const dateLocale = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

/** La date du jour, ou de `jours` jours plus tard, au format d'un champ date (`AAAA-MM-JJ`, fuseau du joueur). */
export function dateDans(jours: number, maintenant = new Date()): string {
  const jour = new Date(maintenant.getTime() + jours * JOUR_MS);
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${jour.getFullYear()}-${deux(jour.getMonth() + 1)}-${deux(jour.getDate())}`;
}

/** « 3 comptes créés sur 20 », « Aucun compte créé sur 5 ». */
export function usage(invitation: Pick<Invitation, 'utilisations' | 'utilisationsMax'>): string {
  const { utilisations, utilisationsMax } = invitation;
  if (utilisations === 0) return `Aucun compte créé sur ${utilisationsMax}`;
  return `${utilisations} ${utilisations > 1 ? 'comptes créés' : 'compte créé'} sur ${utilisationsMax}`;
}

/**
 * « valable jusqu'au 31 décembre 2026 », ou « révoquée le 23 octobre 2026 ». Une invitation expire à minuit UTC, à la
 * fin de son dernier jour : c'est ce jour qui est cité.
 */
export function echeance(invitation: Pick<Invitation, 'expireLe' | 'revoqueeLe'>): string {
  if (invitation.revoqueeLe) {
    return `révoquée le ${dateLocale.format(new Date(invitation.revoqueeLe))}`;
  }
  const dernierJour = dateLongue.format(new Date(Date.parse(invitation.expireLe) - 1));
  return `valable jusqu’au ${dernierJour}`;
}

/**
 * Page « Inviter » (US-072, ADR 0029), réservée aux administrateurs : créer une invitation, copier ou partager son
 * lien, suivre l'usage des invitations et en révoquer une. Pour tout autre joueur, elle renvoie à l'accueil, et l'API
 * répond 404 à ses routes : c'est le serveur qui fait foi.
 */
@Component({
  selector: 'hip-inviter',
  imports: [RouterLink, EtatSession, ErreurChargement],
  templateUrl: './inviter.html',
})
export class InviterEcran {
  protected readonly compte = inject(CompteService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly injecteur = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly administrateur = computed(() => this.compte.joueur()?.administrateur === true);

  protected readonly libelle = signal('');
  protected readonly utilisations = signal('10');
  protected readonly expire = signal(dateDans(30));
  /** Pas de date limite passée : aujourd'hui vaut jusqu'à la fin du jour. */
  protected readonly aujourdhui = dateDans(0);

  /** L'invitation qui vient d'être créée, avec son code et son lien (montrés cette seule fois). */
  protected readonly creee = signal<InvitationCreee | null>(null);
  protected readonly invitations = signal<Invitation[] | null>(null);
  protected readonly panne = signal<unknown>(null);
  protected readonly enLecture = signal(false);
  /** L'invitation dont la révocation attend confirmation. */
  protected readonly aRevoquer = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly occupe = signal(false);
  protected readonly copie = signal(false);
  /** Le menu de partage du téléphone (Web Share), quand le navigateur en a un. */
  protected readonly partageDisponible = typeof navigator.share === 'function';

  protected readonly statut = LIBELLES_STATUT;
  protected readonly usage = usage;
  protected readonly echeance = echeance;

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
        this.http.get<{ invitations: Invitation[] }>('/api/v1/admin/invitations'),
      );
      this.invitations.set(reponse.invitations);
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
      const creee = await firstValueFrom(
        this.http.post<InvitationCreee>('/api/v1/admin/invitations', {
          libelle: this.libelle().trim(),
          utilisations: Number(this.utilisations()),
          expire: this.expire(),
        }),
      );
      this.creee.set(creee);
      this.invitations.update((liste) => [creee.invitation, ...(liste ?? [])]);
      this.libelle.set('');
      this.focaliser('titre-creee');
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

  protected async partager(creee: InvitationCreee): Promise<void> {
    try {
      await navigator.share({
        title: 'Invitation à HIPMaster',
        text: 'Une invitation à jouer à HIPMaster, le jeu de cartes de l’IT : créez votre compte avec ce lien.',
        url: creee.lien,
      });
    } catch {
      // Partage annulé, ou refusé par le navigateur : « Copier le lien » reste là.
    }
  }

  protected oublierLien(): void {
    this.creee.set(null);
    this.copie.set(false);
    this.focaliser('titre-nouvelle');
  }

  protected demanderRevocation(id: string): void {
    this.aRevoquer.set(id);
    this.focaliser(`garder-${id}`);
  }

  protected annulerRevocation(id: string): void {
    this.aRevoquer.set(null);
    this.focaliser(`revoquer-${id}`);
  }

  protected async revoquer(invitation: Invitation): Promise<void> {
    await this.agir(async () => {
      const revoquee = await firstValueFrom(
        this.http.post<Invitation>(`/api/v1/admin/invitations/${invitation.id}/revocation`, {}),
      );
      this.invitations.update((liste) =>
        (liste ?? []).map((i) => (i.id === revoquee.id ? revoquee : i)),
      );
      if (this.creee()?.invitation.id === revoquee.id) this.creee.set(null);
      this.info.set(
        `Invitation « ${revoquee.libelle} » révoquée : son lien ne crée plus de compte ; les comptes déjà créés restent.`,
      );
      this.focaliser(`invitation-${revoquee.id}`);
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
          'Invitation refusée : un libellé de 1 à 80 caractères, de 1 à 1000 comptes, et une date limite ' +
          'à partir d’aujourd’hui.',
        404: 'Cette invitation n’est plus en cours, ou ce compte n’est plus administrateur.',
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
