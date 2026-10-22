import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import type { Deck } from '../jeu/modele';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { expliquer } from '../reseau/reseau';
import type { Duel } from './modele';

/**
 * « Défier un collègue » (US-033) : choisir son deck, créer le duel, puis partager son lien. Avec la donnée de route
 * `hasard` : « Adversaire au hasard » (US-037), le deck choisi rejoint un duel ouvert ou en ouvre un.
 */
@Component({
  selector: 'hip-nouveau-defi',
  imports: [RouterLink, ErreurChargement, EtatSession],
  template: `
    <main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <p>
        <a routerLink="/jouer" class="text-texte-doux underline underline-offset-4">← Jouer</a>
      </p>
      <h1 class="text-3xl font-bold tracking-tight">
        {{ hasard() ? 'Adversaire au hasard' : 'Défier un collègue' }}
      </h1>
      @if (compte.joueur()) {
        <p class="text-texte-doux">
          @if (hasard()) {
            Choisissez votre deck : vous affronterez le premier joueur qui attend un adversaire, ou
            vous attendrez le suivant. Le duel se joue au tour par tour, chacun à son rythme.
          } @else {
            Choisissez votre deck : vous obtiendrez un lien à envoyer à votre collègue. Le duel se
            joue au tour par tour, chacun à son rythme.
          }
        </p>
        @if (erreur()) {
          <p role="alert" class="text-alerte">{{ erreur() }}</p>
        }
        @if (decks.hasValue()) {
          <ul class="flex flex-col gap-3">
            @for (deck of decks.value(); track deck.id) {
              <li
                class="flex flex-col gap-3 rounded-xl border border-bordure p-4 sm:flex-row sm:items-center"
              >
                <div class="flex-1">
                  <h2 class="text-xl font-semibold">{{ deck.nom }}</h2>
                  <p class="text-texte-doux">{{ deck.description }}</p>
                </div>
                <button
                  type="button"
                  class="rounded-lg bg-accent px-4 py-3 font-semibold text-sur-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                  [disabled]="enCours() !== null"
                  (click)="defier(deck)"
                >
                  {{
                    enCours() === deck.id
                      ? 'Recherche…'
                      : (hasard() ? 'Jouer avec ' : 'Défier avec ') + deck.nom
                  }}
                </button>
              </li>
            }
          </ul>
        } @else if (decks.error()) {
          <hip-erreur-chargement
            quoi="Les decks n’ont pas pu être chargés."
            [erreur]="decks.error()"
            [enCours]="decks.isLoading()"
            (reessayer)="decks.reload()"
          />
        } @else {
          <p>Chargement des decks…</p>
        }
      } @else if (compte.pret()) {
        <p>
          Pour jouer en duel, il faut un compte.
          <a
            routerLink="/compte"
            [queryParams]="{ retour: hasard() ? '/duels/hasard' : '/duels/nouveau' }"
            class="font-semibold underline underline-offset-4"
            >Créer un compte</a
          >
          en un clic (un pseudo suffit).
        </p>
      } @else {
        <hip-etat-session />
      }
    </main>
  `,
})
export class NouveauDefi {
  protected readonly compte = inject(CompteService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** Donnée de route : adversaire au hasard (US-037) plutôt que défi par lien. */
  readonly hasard = input(false, {
    transform: (valeur: boolean | undefined) => valeur ?? false,
  });

  protected readonly decks = httpResource<Deck[]>(() => '/api/v1/decks');
  protected readonly enCours = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected async defier(deck: Deck): Promise<void> {
    this.enCours.set(deck.id);
    this.erreur.set(null);
    try {
      const url = this.hasard() ? '/api/v1/duels/hasard' : '/api/v1/duels';
      const duel = await firstValueFrom(this.http.post<Duel>(url, { deck: deck.id }));
      await this.router.navigate(['/duels', duel.id]);
    } catch (erreur) {
      this.erreur.set(`Le duel n’a pas pu être créé. ${expliquer(erreur)}`);
    } finally {
      this.enCours.set(null);
    }
  }
}
