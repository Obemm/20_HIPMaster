import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { expliquer } from '../reseau/reseau';
import { ClassementService, ordinal } from './classement.service';

/**
 * Page « Classement » (US-069, ADR 0044) : mon score, mon rang et ma cote de duel, les joueurs classés, la règle en
 * bref, et de quoi se retirer du classement.
 */
@Component({
  selector: 'hip-classement',
  imports: [RouterLink, ErreurChargement, EtatSession],
  templateUrl: './classement.html',
})
export class ClassementEcran {
  protected readonly compte = inject(CompteService);
  protected readonly service = inject(ClassementService);
  protected readonly ordinal = ordinal;

  protected readonly classement = this.service.classement;
  /** Ce qui empêche d'afficher le classement : seulement s'il n'a jamais pu être lu. */
  protected readonly echec = computed(() => (this.classement() ? null : this.service.erreur()));
  protected readonly enregistrement = signal(false);
  protected readonly erreurChoix = signal<string | null>(null);

  constructor() {
    // Le classement bouge sans cesse : relu à chaque ouverture de la page, ou une fois connecté.
    effect(() => {
      if (this.compte.joueur()) untracked(() => void this.service.charger());
    });
  }

  protected async basculer(evenement: Event): Promise<void> {
    const coche = evenement.target as HTMLInputElement;
    this.enregistrement.set(true);
    this.erreurChoix.set(null);
    try {
      await this.service.changer(coche.checked);
    } catch (erreur) {
      coche.checked = !coche.checked;
      this.erreurChoix.set(`Votre choix n’a pas pu être enregistré. ${expliquer(erreur)}`);
    } finally {
      this.enregistrement.set(false);
    }
  }
}
