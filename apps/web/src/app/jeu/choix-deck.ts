import { HttpClient, httpResource } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Carte } from '../cartes/carte';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { PreferencesService } from '../preferences';
import { expliquer } from '../reseau/reseau';
import type { Deck, Niveau, Partie } from './modele';
import { BoiteDeck } from './boite-deck';
import { RegleCourte } from './regle-courte';

/**
 * Choix d'un deck prêté, puis création de la partie contre le bot (US-013). Les decks se présentent en boîtes de jeu,
 * avec leurs cartes phares tirées du catalogue (US-068).
 */
@Component({
  selector: 'hip-choix-deck',
  imports: [NgTemplateOutlet, RouterLink, RegleCourte, ErreurChargement, BoiteDeck],
  templateUrl: './choix-deck.html',
})
export class ChoixDeck {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  protected readonly preferences = inject(PreferencesService);

  protected readonly decks = httpResource<Deck[]>(() => '/api/v1/decks');
  protected readonly catalogue = httpResource<Carte[]>(() => '/api/v1/cartes');
  protected readonly niveaux = httpResource<Niveau[]>(() => '/api/v1/niveaux');
  /** Niveau du bot choisi (Stagiaire par défaut, le plus simple : US-064). */
  protected readonly niveau = signal('stagiaire');
  protected readonly enCours = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected jouer(deck: Deck): Promise<void> {
    return this.lancer(deck.id, { deck: deck.id, niveau: this.niveau() });
  }

  /** La partie guidée (US-067) : le serveur fixe decks, graine et niveau (ADR 0040). */
  protected jouerGuidee(): Promise<void> {
    return this.lancer('guidee', { guidee: true });
  }

  private async lancer(id: string, corps: object): Promise<void> {
    this.enCours.set(id);
    this.erreur.set(null);
    try {
      const partie = await firstValueFrom(this.http.post<Partie>('/api/v1/parties', corps));
      await this.router.navigate(['/jouer', partie.id]);
    } catch (erreur) {
      this.erreur.set(`La partie n’a pas pu être créée. ${expliquer(erreur)}`);
    } finally {
      this.enCours.set(null);
    }
  }
}
