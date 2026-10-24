import { Component, inject, input } from '@angular/core';
import { adresseDansLaLangue, LANGUE, type Langue, LANGUES } from './langue';
import { PreferencesService } from './preferences';

/**
 * Sélecteur de langue (US-079) : FR et EN, la langue de la page signalée par `aria-current`, l'autre en lien vers la
 * même page dans sa langue. Chaque nom est lu dans sa propre langue (`lang`), et le choix est retenu (ADR 0032).
 */
@Component({
  selector: 'hip-choix-langue',
  template: `
    <nav i18n-aria-label aria-label="Langue">
      <ul class="flex items-center">
        @for (langue of langues; track langue.code) {
          <li>
            @if (langue.code === courante) {
              <span class="langue" aria-current="true" [attr.lang]="langue.code"
                ><span aria-hidden="true">{{ langue.court }}</span
                ><span class="sr-only">{{ langue.nom }}</span></span
              >
            } @else {
              <a
                class="langue"
                [href]="adresse(langue.code)"
                [attr.lang]="langue.code"
                [attr.hreflang]="langue.code"
                (click)="preferences.choisirLangue(langue.code)"
                ><span aria-hidden="true">{{ langue.court }}</span
                ><span class="sr-only">{{ langue.nom }}</span></a
              >
            }
          </li>
        }
      </ul>
    </nav>
  `,
})
export class ChoixLangue {
  /** Chemin de la page dans l'application (`/collection`), repris dans l'autre langue. */
  readonly chemin = input.required<string>();

  protected readonly preferences = inject(PreferencesService);
  protected readonly langues = LANGUES;
  protected readonly courante = LANGUE;

  protected adresse(langue: Langue): string {
    return adresseDansLaLangue(langue, this.chemin());
  }
}
