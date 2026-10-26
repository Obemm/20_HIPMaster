import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompteService } from '../compte/compte.service';
import { MesDecksService } from './mes-decks.service';

/**
 * Sous la liste des decks à choisir pour jouer (US-084) : combien de mes decks, incomplets, ne sont pas proposés, ou
 * l'invitation à construire les siens. Rien sans compte.
 */
@Component({
  selector: 'hip-avis-mes-decks',
  imports: [RouterLink],
  template: `
    @if (compte.joueur() && mesDecks.decks()) {
      @if (mesDecks.incomplets(); as n) {
        <!-- prettier-ignore -->
        <p class="text-sm text-texte-doux" i18n>{n, plural, =1 {Un de vos decks est incomplet : il n’est pas proposé.} other {{{ n }} de vos decks sont incomplets : ils ne sont pas proposés.}} <a routerLink="/decks" class="lien">Les compléter dans « Mes decks »</a></p>
      } @else if (mesDecks.jouables().length === 0) {
        <p class="text-sm text-texte-doux" i18n>
          <a routerLink="/decks" class="lien">Construisez vos decks</a> avec les cartes de votre
          collection pour jouer avec.
        </p>
      }
    }
  `,
})
export class AvisMesDecks {
  protected readonly compte = inject(CompteService);
  protected readonly mesDecks = inject(MesDecksService);
}
