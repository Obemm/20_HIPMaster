import { Component, computed, input, output } from '@angular/core';
import { expliquer } from './reseau';

/**
 * Un chargement qui a échoué (US-055) : ce qui manque, pourquoi (serveur injoignable, trop de demandes…), et
 * « Réessayer ». Pendant un nouvel essai, le bouton patiente.
 */
@Component({
  selector: 'hip-erreur-chargement',
  template: `
    <p role="alert" class="text-alerte">{{ quoi() }} {{ cause() }}</p>
    <p>
      <button
        type="button"
        class="rounded-lg border-2 border-accent px-4 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        [disabled]="enCours()"
        (click)="reessayer.emit()"
      >
        {{ enCours() ? 'Nouvel essai…' : 'Réessayer' }}
      </button>
    </p>
  `,
  host: { class: 'flex flex-col items-start gap-2' },
})
export class ErreurChargement {
  /** Ce qui n'a pas pu être chargé, en une phrase : « Le catalogue n’a pas pu être chargé. » */
  readonly quoi = input.required<string>();
  readonly erreur = input<unknown>();
  readonly enCours = input(false);
  readonly reessayer = output();

  protected readonly cause = computed(() => expliquer(this.erreur()));
}
