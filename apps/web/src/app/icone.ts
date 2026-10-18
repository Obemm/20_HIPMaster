import { Component, input } from '@angular/core';

/** Tracés SVG (grille 24 × 24, trait de 2) : dessinés pour le projet, sans dépendance. */
const TRACES = {
  // Familles
  fichiers: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z M14 3v5h5 M9 13h6 M9 17h6',
  esb: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M12 3v6 M12 15v6 M3 12h6 M15 12h6',
  api: 'M8 6l-5 6 5 6 M16 6l5 6-5 6 M14 4l-4 16',
  ipaas: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 11.1 3.5 3.5 0 0 0 7 18z',
  eda: 'M12 12h.01 M8.5 8.5a5 5 0 0 0 0 7 M15.5 8.5a5 5 0 0 1 0 7 M5.5 5.5a9 9 0 0 0 0 13 M18.5 5.5a9 9 0 0 1 0 13',
  ia: 'M12 3l2 6.5L20.5 12 14 14.5 12 21l-2-6.5L3.5 12 10 9.5z M19 3v4 M17 5h4',
  patterns: 'M6 3v18 M6 13h6a6 6 0 0 0 6-6V3 M15 6l3-3 3 3',
  bestiaire: 'M12 3l10 18H2z M12 10v5 M12 18h.01',
  // Statistiques et interface
  debit: 'M13 2L4 14h7l-1 8 9-12h-7z',
  attaque: 'M20 4L9 15 M20 4h-5 M20 4v5 M7 13l4 4 M8 16l-4 4',
  pv: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  fermer: 'M6 6l12 12 M18 6L6 18',
} as const;

export type NomIcone = keyof typeof TRACES;

/** Icône décorative : le sens est toujours porté par un texte à côté (visible ou `sr-only`). */
@Component({
  selector: 'hip-icone',
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    class="size-full"
  >
    <path [attr.d]="trace()" />
  </svg>`,
  host: { class: 'inline-block shrink-0' },
})
export class Icone {
  readonly nom = input.required<NomIcone>();
  protected trace(): string {
    return TRACES[this.nom()];
  }
}
