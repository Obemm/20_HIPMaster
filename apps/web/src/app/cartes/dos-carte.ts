import { Component } from '@angular/core';

/**
 * Le dos d'une carte (US-061) : la nuit, une trame et le logo au centre. Décoratif : il tient la place d'une carte
 * pendant un chargement, ou figure un paquet. Les styles sont dans styles.css (`.dos-carte`).
 */
@Component({
  selector: 'hip-dos-carte',
  template: `<img src="logo.svg" alt="" width="64" height="64" class="w-2/5 drop-shadow-lg" />`,
  host: { class: 'dos-carte', 'aria-hidden': 'true' },
})
export class DosCarte {}
