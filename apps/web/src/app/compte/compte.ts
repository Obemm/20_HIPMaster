import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { expliquer } from '../reseau/reseau';
import { CompteService } from './compte.service';
import { EtatSession } from './etat-session';

/**
 * Page « Mon compte » (US-022) : créer un compte invité, le retrouver avec son code, se déconnecter. Après un 401, elle
 * dit « Session expirée » et ramène le joueur à sa page une fois reconnecté (US-055).
 */
@Component({
  selector: 'hip-compte',
  imports: [RouterLink, EtatSession],
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

  protected readonly pseudo = signal('');
  protected readonly code = signal('');
  /** Le code de récupération à montrer (une seule fois). */
  protected readonly codeAffiche = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly occupe = signal(false);
  protected readonly copie = signal(false);

  protected async creer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    await this.agir(async () => {
      this.codeAffiche.set(await this.compte.creer(this.pseudo().trim()));
    }, 'Ce pseudo ne convient pas : 2 à 24 lettres, chiffres, espaces, tirets, points ou soulignés.');
  }

  protected async recuperer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    await this.agir(async () => {
      await this.compte.recuperer(this.code());
      const retour = this.retourSur();
      if (retour) await this.router.navigateByUrl(retour);
    }, 'Code de récupération inconnu : vérifiez-le, ou créez un nouveau compte.');
  }

  protected async regenerer(): Promise<void> {
    await this.agir(async () => {
      this.codeAffiche.set(await this.compte.nouveauCode());
    }, 'Le code n’a pas pu être régénéré.');
  }

  protected async deconnecter(): Promise<void> {
    await this.agir(async () => {
      this.codeAffiche.set(null);
      await this.compte.deconnecter();
    }, 'La déconnexion a échoué.');
  }

  protected async copier(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.copie.set(true);
    } catch {
      this.copie.set(false);
    }
  }

  /** Lance une action ; un refus de l'API (400, 401) affiche `messageRefus`, une panne sa cause. */
  private async agir(action: () => Promise<void>, messageRefus: string): Promise<void> {
    this.occupe.set(true);
    this.erreur.set(null);
    this.copie.set(false);
    try {
      await action();
    } catch (erreur) {
      const refus = erreur instanceof HttpErrorResponse && [400, 401].includes(erreur.status);
      this.erreur.set(refus ? messageRefus : expliquer(erreur));
    } finally {
      this.occupe.set(false);
    }
  }
}
