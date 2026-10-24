import { Component } from '@angular/core';

/**
 * Un paquet de booster scellé (US-062) : feuille métallisée, dentelures, logo et « Set 1 ». Décoratif : le stock est
 * toujours dit en toutes lettres à côté. Les styles sont dans styles.css (`.paquet`).
 */
@Component({
  selector: 'hip-paquet-booster',
  template: `
    <img src="logo.svg" alt="" width="64" height="64" />
    <span class="paquet-libelle">Set 1</span>
  `,
  host: { class: 'paquet', 'aria-hidden': 'true' },
})
export class PaquetBooster {}
