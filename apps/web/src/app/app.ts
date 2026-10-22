import { Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { CompteService } from './compte/compte.service';
import { MesDuelsService } from './duels/mes-duels.service';

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
          <span class="flex items-center gap-4">
            <a routerLink="/duels" class="flex items-center gap-1 underline underline-offset-4">
              Duels
              @if (duels.aMonTour() > 0) {
                <span
                  class="rounded-full bg-accent px-1.5 text-xs font-bold text-sur-accent no-underline"
                  >{{ duels.aMonTour() }}<span class="sr-only"> à vous de jouer</span></span
                >
              }
            </a>
            <a routerLink="/boosters" class="underline underline-offset-4">Boosters</a>
            <a routerLink="/collection" class="underline underline-offset-4">Collection</a>
            <a routerLink="/compte" class="underline underline-offset-4">
              <span class="sr-only">Mon compte : </span>{{ joueur.pseudo }}
            </a>
          </span>
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
  protected readonly duels = inject(MesDuelsService);

  constructor() {
    // Vérifie la session gardée par le navigateur, sans retarder l'affichage.
    void this.compte.charger();
    // « À vous de jouer » se met à jour à chaque changement de page (US-035), et une session que le serveur n'a pas
    // pu vérifier est revérifiée (US-055).
    const navigation = inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        void this.duels.charger();
        if (this.compte.echec()) void this.compte.charger();
      });
    inject(DestroyRef).onDestroy(() => navigation.unsubscribe());
  }
}
