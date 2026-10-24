import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Carte } from '../cartes/carte';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { BoiteDeck } from '../jeu/boite-deck';
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
  imports: [RouterLink, ErreurChargement, EtatSession, BoiteDeck],
  template: `
    <main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div class="flex flex-col gap-2">
        <p class="surtitre" i18n>Duel entre joueurs</p>
        <h1 class="titre-page">
          @if (hasard()) {
            <ng-container i18n>Adversaire au hasard</ng-container>
          } @else {
            <ng-container i18n>Défier un collègue</ng-container>
          }
        </h1>
      </div>
      @if (compte.joueur()) {
        <p class="text-texte-doux">
          @if (hasard()) {
            <ng-container i18n
              >Choisissez votre deck : vous affronterez le premier joueur qui attend un adversaire,
              ou vous attendrez le suivant. Le duel se joue au tour par tour, chacun à son
              rythme.</ng-container
            >
          } @else {
            <ng-container i18n
              >Choisissez votre deck : vous obtiendrez un lien à envoyer à votre collègue. Le duel
              se joue au tour par tour, chacun à son rythme.</ng-container
            >
          }
        </p>
        @if (erreur()) {
          <p role="alert" class="text-alerte">{{ erreur() }}</p>
        }
        @if (decks.hasValue()) {
          <ul class="flex flex-col gap-3">
            @for (deck of decks.value(); track deck.id) {
              <li>
                <hip-boite-deck [deck]="deck" [catalogue]="catalogue.value()">
                  <button
                    type="button"
                    class="bouton bouton-jeu self-stretch sm:self-end"
                    [disabled]="enCours() !== null"
                    (click)="defier(deck)"
                  >
                    @if (enCours() === deck.id) {
                      <ng-container i18n>Recherche…</ng-container>
                    } @else if (hasard()) {
                      <ng-container i18n>Jouer avec {{ deck.nom }}</ng-container>
                    } @else {
                      <ng-container i18n>Défier avec {{ deck.nom }}</ng-container>
                    }
                  </button>
                </hip-boite-deck>
              </li>
            }
          </ul>
        } @else if (decks.error()) {
          <hip-erreur-chargement
            i18n-quoi
            quoi="Les decks n’ont pas pu être chargés."
            [erreur]="decks.error()"
            [enCours]="decks.isLoading()"
            (reessayer)="decks.reload()"
          />
        } @else {
          <p i18n>Chargement des decks…</p>
        }
      } @else if (compte.pret()) {
        <p i18n>
          Pour jouer en duel, il faut un compte.
          <a
            routerLink="/compte"
            [queryParams]="{ retour: hasard() ? '/duels/hasard' : '/duels/nouveau' }"
            class="lien"
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
  protected readonly catalogue = httpResource<Carte[]>(() => '/api/v1/cartes');
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
      this.erreur.set($localize`Le duel n’a pas pu être créé. ${expliquer(erreur)}:cause:`);
    } finally {
      this.enCours.set(null);
    }
  }
}
