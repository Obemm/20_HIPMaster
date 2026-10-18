import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';
import type { Deck } from '../jeu/modele';
import type { Duel } from './modele';

/** « Défier un collègue » (US-033) : choisir son deck, créer le duel, puis partager son lien. */
@Component({
  selector: 'hip-nouveau-defi',
  imports: [RouterLink],
  template: `
    <main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <p>
        <a routerLink="/jouer" class="text-texte-doux underline underline-offset-4">← Jouer</a>
      </p>
      <h1 class="text-3xl font-bold tracking-tight">Défier un collègue</h1>
      @if (compte.joueur()) {
        <p class="text-texte-doux">
          Choisissez votre deck : vous obtiendrez un lien à envoyer à votre collègue. Le duel se
          joue au tour par tour, chacun à son rythme.
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
                  {{ enCours() === deck.id ? 'Création…' : 'Défier avec ' + deck.nom }}
                </button>
              </li>
            }
          </ul>
        } @else if (decks.error()) {
          <p role="alert" class="text-alerte">Les decks n’ont pas pu être chargés.</p>
        } @else {
          <p>Chargement des decks…</p>
        }
      } @else if (compte.pret()) {
        <p>
          Pour défier un collègue, il faut un compte.
          <a
            routerLink="/compte"
            [queryParams]="{ retour: '/duels/nouveau' }"
            class="font-semibold underline underline-offset-4"
            >Créer un compte</a
          >
          en un clic (un pseudo suffit).
        </p>
      } @else {
        <p>Vérification de votre session…</p>
      }
    </main>
  `,
})
export class NouveauDefi {
  protected readonly compte = inject(CompteService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly decks = httpResource<Deck[]>(() => '/api/v1/decks');
  protected readonly enCours = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected async defier(deck: Deck): Promise<void> {
    this.enCours.set(deck.id);
    this.erreur.set(null);
    try {
      const duel = await firstValueFrom(this.http.post<Duel>('/api/v1/duels', { deck: deck.id }));
      await this.router.navigate(['/duels', duel.id]);
    } catch {
      this.erreur.set('Le défi n’a pas pu être créé : réessayez dans un instant.');
    } finally {
      this.enCours.set(null);
    }
  }
}
