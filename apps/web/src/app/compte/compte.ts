import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompteService } from './compte.service';

/** Page « Mon compte » (US-022) : créer un compte invité, le retrouver avec son code, se déconnecter. */
@Component({
  selector: 'hip-compte',
  imports: [RouterLink],
  templateUrl: './compte.html',
})
export class CompteEcran {
  protected readonly compte = inject(CompteService);

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
    await this.agir(
      () => this.compte.recuperer(this.code()),
      'Code de récupération inconnu : vérifiez-le, ou créez un nouveau compte.',
    );
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

  /** Lance une action ; un refus de l'API (400, 401) affiche `messageRefus`, une panne un message générique. */
  private async agir(action: () => Promise<void>, messageRefus: string): Promise<void> {
    this.occupe.set(true);
    this.erreur.set(null);
    this.copie.set(false);
    try {
      await action();
    } catch (erreur) {
      const refus = erreur instanceof HttpErrorResponse && [400, 401].includes(erreur.status);
      this.erreur.set(refus ? messageRefus : 'L’API ne répond pas : réessayez dans un instant.');
    } finally {
      this.occupe.set(false);
    }
  }
}
