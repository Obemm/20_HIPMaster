import { Component, input } from '@angular/core';
import type { Carte } from './carte';
import { DosCarte } from './dos-carte';
import { VignetteCarte } from './vignette-carte';

/** Les cartes mises en avant par l'accueil : du FTP aux agents d'IA, l'histoire que raconte le jeu. */
export const CARTES_VEDETTES: readonly number[] = [18, 39, 1];

/** Les cartes vedettes d'un catalogue, dans l'ordre de l'éventail ; celles qui manquent sont ignorées. */
export function cartesVedettes(catalogue: readonly Carte[]): Carte[] {
  return CARTES_VEDETTES.flatMap((numero) => catalogue.filter((c) => c.numero === numero));
}

/**
 * Trois cartes en éventail (US-061) : on comprend d'un coup d'œil que c'est un jeu de cartes. Tant que les cartes ne
 * sont pas là (chargement, panne), trois dos de carte tiennent leur place. Disposition et entrée : styles.css.
 */
@Component({
  selector: 'hip-eventail-cartes',
  imports: [DosCarte, VignetteCarte],
  template: `
    @if (cartes()?.length) {
      <ul class="eventail" aria-label="Quelques cartes du jeu">
        @for (carte of cartes(); track carte.numero) {
          <li><hip-vignette-carte [carte]="carte" [titre]="false" /></li>
        }
      </ul>
    } @else {
      <div class="eventail" aria-hidden="true">
        <hip-dos-carte /><hip-dos-carte /><hip-dos-carte />
      </div>
    }
  `,
})
export class EventailCartes {
  /** Les cartes à montrer ; `undefined` tant qu'elles se chargent. */
  readonly cartes = input<readonly Carte[]>();
}
