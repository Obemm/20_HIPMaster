import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Deck, Partie } from './modele';
import { RegleCourte } from './regle-courte';

/** Choix d'un deck prêté, puis création de la partie contre le bot (US-013). */
@Component({
  selector: 'hip-choix-deck',
  imports: [RouterLink, RegleCourte],
  templateUrl: './choix-deck.html',
})
export class ChoixDeck {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly decks = httpResource<Deck[]>(() => '/api/v1/decks');
  protected readonly enCours = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected async jouer(deck: Deck): Promise<void> {
    this.enCours.set(deck.id);
    this.erreur.set(null);
    try {
      const partie = await firstValueFrom(
        this.http.post<Partie>('/api/v1/parties', { deck: deck.id }),
      );
      await this.router.navigate(['/jouer', partie.id]);
    } catch {
      this.erreur.set('La partie n’a pas pu être créée : l’API ne répond pas.');
    } finally {
      this.enCours.set(null);
    }
  }
}
