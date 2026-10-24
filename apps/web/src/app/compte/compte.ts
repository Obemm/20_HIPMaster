import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { cartesVedettes, EventailCartes } from '../cartes/eventail-cartes';
import { expliquer } from '../reseau/reseau';
import { CompteService } from './compte.service';
import { EtatSession } from './etat-session';

/** Ce que dit la page après la fermeture des autres sessions du compte (US-047). */
export function bilanDeconnexion(sessionsFermees: number): string {
  if (sessionsFermees === 0) return 'Aucun autre appareil n’était connecté.';
  if (sessionsFermees === 1) return 'Votre autre appareil a été déconnecté.';
  return `Vos ${sessionsFermees} autres appareils ont été déconnectés.`;
}

/** Messages des refus de l'API, par statut ; une panne, ou un autre statut, affiche sa cause. */
type Refus = Partial<Record<number, string>>;
const refusDe = (message: string): Refus => ({ 400: message, 401: message });

/**
 * Page « Mon compte » (US-022) : créer un compte invité, le retrouver avec son code, se déconnecter. Après un 401, elle
 * dit « Session expirée » et ramène le joueur à sa page une fois reconnecté (US-055). Un nouveau code, ou « Déconnecter
 * mes autres appareils », ferme les autres sessions du compte (US-047). Un lien d'invitation (`?invitation=`) remplit
 * le code d'invitation (US-048). « Supprimer mon compte », après confirmation, supprime le compte et déconnecte
 * (US-053).
 */
@Component({
  selector: 'hip-compte',
  imports: [RouterLink, EtatSession, EventailCartes],
  templateUrl: './compte.html',
})
export class CompteEcran {
  protected readonly compte = inject(CompteService);
  private readonly router = inject(Router);

  /**
   * Paramètre `?retour=` : la page d'où vient le joueur (un défi, US-033). Seuls les chemins internes sont suivis,
   * jamais une adresse extérieure.
   */
  readonly retour = input<string>();
  protected readonly retourSur = computed(() => {
    const retour = this.retour();
    return retour?.startsWith('/') && !retour.startsWith('//') ? retour : null;
  });
  protected readonly libelleRetour = computed(() =>
    this.retourSur()?.startsWith('/duels')
      ? 'Code noté : revenir au défi'
      : 'Code noté : revenir à ma page',
  );

  /** Paramètre `?invitation=` : le code d'un lien d'invitation (US-048), qui remplit le champ. */
  readonly invitation = input<string>();
  /**
   * Un lien d'invitation arrive ici : la page accueille l'invité avec les cartes de l'accueil (US-061), chargées
   * seulement dans ce cas.
   */
  private readonly catalogue = httpResource<Carte[]>(() =>
    this.invitation()?.trim() ? '/api/v1/cartes' : undefined,
  );
  protected readonly vedettes = computed(() =>
    this.catalogue.hasValue() ? cartesVedettes(this.catalogue.value()) : undefined,
  );

  protected readonly pseudo = signal('');
  protected readonly codeInvitation = linkedSignal(() => this.invitation()?.trim() ?? '');
  protected readonly code = signal('');
  /** Le code de récupération à montrer (une seule fois). */
  protected readonly codeAffiche = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  /** Le bilan de la dernière action, annoncé aux lecteurs d'écran (appareils déconnectés). */
  protected readonly info = signal<string | null>(null);
  protected readonly occupe = signal(false);
  protected readonly copie = signal(false);
  /** La suppression du compte attend sa confirmation (US-053). */
  protected readonly confirmerSuppression = signal(false);
  /** Le compte vient d'être supprimé : la page le dit. */
  protected readonly supprime = signal(false);

  protected async creer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    const invitation = this.codeInvitation().trim() || undefined;
    await this.agir(
      async () => {
        this.codeAffiche.set(await this.compte.creer(this.pseudo().trim(), invitation));
      },
      {
        ...refusDe(
          'Ce pseudo ne convient pas : 2 à 24 lettres, chiffres, espaces, tirets, points ou soulignés.',
        ),
        403:
          'Ce code d’invitation n’est pas accepté : vérifiez-le auprès de qui vous a invité. Il a pu ' +
          'expirer, ou déjà servir autant de fois que prévu.',
      },
    );
  }

  protected async recuperer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    await this.agir(async () => {
      await this.compte.recuperer(this.code());
      const retour = this.retourSur();
      if (retour) await this.router.navigateByUrl(retour);
    }, refusDe('Code de récupération inconnu : vérifiez-le, ou créez un nouveau compte.'));
  }

  protected async regenerer(): Promise<void> {
    await this.agir(async () => {
      const { codeRecuperation, sessionsFermees } = await this.compte.nouveauCode();
      this.codeAffiche.set(codeRecuperation);
      this.info.set(bilanDeconnexion(sessionsFermees));
    }, refusDe('Le code n’a pas pu être régénéré.'));
  }

  protected async deconnecterAutres(): Promise<void> {
    await this.agir(async () => {
      this.info.set(bilanDeconnexion(await this.compte.deconnecterAutresAppareils()));
    }, refusDe('Les autres appareils n’ont pas pu être déconnectés.'));
  }

  protected async deconnecter(): Promise<void> {
    await this.agir(async () => {
      this.codeAffiche.set(null);
      await this.compte.deconnecter();
    }, refusDe('La déconnexion a échoué.'));
  }

  protected async supprimer(): Promise<void> {
    await this.agir(async () => {
      await this.compte.supprimerCompte();
      this.codeAffiche.set(null);
      this.confirmerSuppression.set(false);
      this.supprime.set(true);
    }, refusDe('Le compte n’a pas pu être supprimé.'));
  }

  protected async copier(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.copie.set(true);
    } catch {
      this.copie.set(false);
    }
  }

  /** Lance une action ; un refus de l'API affiche le message prévu pour son statut, une panne sa cause. */
  private async agir(action: () => Promise<void>, refus: Refus): Promise<void> {
    this.occupe.set(true);
    this.erreur.set(null);
    this.info.set(null);
    this.copie.set(false);
    this.supprime.set(false);
    try {
      await action();
    } catch (erreur) {
      const message = erreur instanceof HttpErrorResponse ? refus[erreur.status] : undefined;
      this.erreur.set(message ?? expliquer(erreur));
    } finally {
      this.occupe.set(false);
    }
  }
}
