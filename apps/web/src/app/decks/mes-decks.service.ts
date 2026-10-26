import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';
import type { Deck } from '../jeu/modele';

// Contrat : apps/api/openapi/mes-decks.yaml (US-083, ADR 0048).

/** Les règles du deck, rappelées pendant la construction : c'est le serveur qui les applique (ADR 0004). */
export interface ReglesDeck {
  taille: number;
  exemplairesMax: number;
  exemplairesMaxLegendaire: number;
  decksMax: number;
}

/** Un deck du joueur : sa composition effective, sans les cartes sorties de sa collection. */
export interface MonDeck {
  id: string;
  nom: string;
  cartes: number[];
  /** 20 cartes qui respectent les règles : le deck sert à jouer. */
  complet: boolean;
  /** Places libérées par des cartes disparues depuis le dernier enregistrement. */
  liberees: number;
  majLe: string;
}

/** Un problème d'un deck refusé par le serveur (`problemes` d'une réponse 422). */
export type ProblemeDeck =
  | { code: 'taille'; cartes: number }
  | { code: 'carte-inconnue'; numero: number }
  | { code: 'exemplaires'; numero: number; nombre: number; max: number }
  | { code: 'non-possedee'; numero: number; nombre: number; possedes: number };

export interface CompositionDeck {
  nom: string;
  cartes: number[];
}

/**
 * Les decks du joueur connecté (US-083) : chargés à la connexion, oubliés à la déconnexion, tenus à jour après chaque
 * enregistrement. Une lecture qui échoue garde les derniers decks connus, et l'échec pour l'écran (US-055).
 */
@Injectable({ providedIn: 'root' })
export class MesDecksService {
  private readonly http = inject(HttpClient);
  private readonly compte = inject(CompteService);

  /** `null` tant qu'ils ne sont pas chargés (ou sans compte). */
  readonly decks = signal<MonDeck[] | null>(null);
  readonly regles = signal<ReglesDeck | null>(null);
  readonly enCours = signal(false);
  /** L'échec de la dernière lecture ; `null` si elle a réussi. */
  readonly erreur = signal<unknown>(null);

  /**
   * Mes decks complets, à proposer pour jouer (US-084) sous la forme d'un deck prêté : le serveur les revérifie au
   * lancement. Vide sans compte.
   */
  readonly jouables = computed<Deck[]>(() =>
    this.compte.joueur()
      ? (this.decks() ?? [])
          .filter((d) => d.complet)
          .map((d) => ({
            id: d.id,
            nom: d.nom,
            description: $localize`Votre deck, ${d.cartes.length}:nombre: cartes.`,
            cartes: d.cartes,
          }))
      : [],
  );
  /** Mes decks incomplets, qui ne se proposent pas pour jouer tant qu'ils ne sont pas complétés. */
  readonly incomplets = computed(() =>
    this.compte.joueur() ? (this.decks() ?? []).filter((d) => !d.complet).length : 0,
  );

  constructor() {
    effect(() => {
      if (this.compte.joueur()) void this.charger();
      else {
        this.decks.set(null);
        this.erreur.set(null);
      }
    });
  }

  async charger(): Promise<void> {
    this.enCours.set(true);
    try {
      const { regles, decks } = await firstValueFrom(
        this.http.get<{ regles: ReglesDeck; decks: MonDeck[] }>('/api/v1/moi/decks'),
      );
      this.regles.set(regles);
      this.decks.set(decks);
      this.erreur.set(null);
    } catch (erreur) {
      this.erreur.set(erreur);
    } finally {
      this.enCours.set(false);
    }
  }

  async creer(composition: CompositionDeck): Promise<MonDeck> {
    const deck = await firstValueFrom(this.http.post<MonDeck>('/api/v1/moi/decks', composition));
    this.decks.update((decks) => [...(decks ?? []), deck]);
    return deck;
  }

  async modifier(id: string, composition: CompositionDeck): Promise<MonDeck> {
    const deck = await firstValueFrom(
      this.http.put<MonDeck>(`/api/v1/moi/decks/${id}`, composition),
    );
    this.decks.update((decks) => decks?.map((d) => (d.id === id ? deck : d)) ?? [deck]);
    return deck;
  }

  async supprimer(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/v1/moi/decks/${id}`));
    this.decks.update((decks) => decks?.filter((d) => d.id !== id) ?? null);
  }
}
