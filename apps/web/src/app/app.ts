import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CompteService } from './compte/compte.service';

/**
 * Coquille de l'application : un bandeau (accueil, compte du joueur), puis la page, qui fournit son propre `<main>`.
 */
@Component({
  selector: 'hip-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="border-b border-bordure">
      <nav
        class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2 text-sm sm:px-6"
        aria-label="Navigation principale"
      >
        <a routerLink="/" class="font-bold tracking-tight">HIPMaster</a>
        @if (compte.joueur(); as joueur) {
          <a routerLink="/compte" class="underline underline-offset-4">
            <span class="sr-only">Mon compte : </span>{{ joueur.pseudo }}
          </a>
        } @else if (compte.pret()) {
          <a routerLink="/compte" class="underline underline-offset-4">Créer un compte</a>
        }
      </nav>
    </header>
    <router-outlet />
  `,
})
export class App {
  protected readonly compte = inject(CompteService);

  constructor() {
    // Vérifie la session gardée par le navigateur, sans retarder l'affichage.
    void this.compte.charger();
  }
}
