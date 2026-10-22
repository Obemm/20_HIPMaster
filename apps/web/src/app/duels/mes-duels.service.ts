import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';
import { interroger } from '../presence';

// Contrat : apps/api/openapi/duels.yaml (GET /moi/duels, US-035).
export interface ResumeDuel {
  id: string;
  statut: 'attente' | 'en-cours' | 'termine';
  adversaire: { pseudo: string } | null;
  monTour: boolean;
  tour: number | null;
  resultat: 'victoire' | 'defaite' | 'nulle' | null;
  /** Pour un duel terminé : comment il s'est fini (US-036). */
  raison: 'sla' | 'tours' | 'abandon' | 'forfait' | null;
  majLe: string;
  /** Pour un duel en cours : instant limite du coup attendu (US-036). */
  echeance: string | null;
}

/** Délai entre deux mises à jour de la liste quand rien d'autre ne la déclenche. */
const RAFRAICHISSEMENT_MS = 60_000;

/**
 * Les duels du joueur connecté (US-035) : la liste, et le nombre de duels qui attendent son tour, mis à jour à la
 * connexion et toutes les minutes tant que le joueur est là (ADR 0020 : interrogation, pas de notification poussée ;
 * ADR 0021 et US-055 : rien pour un onglet caché ou délaissé). Le bandeau la met aussi à jour à chaque navigation :
 * le service n'injecte pas le routeur, dont la stratégie de titre dépend de lui.
 */
@Injectable({ providedIn: 'root' })
export class MesDuelsService {
  private readonly http = inject(HttpClient);
  private readonly compte = inject(CompteService);

  readonly duels = signal<ResumeDuel[] | null>(null);
  readonly aMonTour = signal(0);
  readonly enCours = signal(false);
  /** L'échec de la dernière lecture ; `null` si elle a réussi. */
  readonly erreur = signal<unknown>(null);

  constructor() {
    effect(() => {
      if (this.compte.joueur()) void this.charger();
      else {
        this.duels.set(null);
        this.aMonTour.set(0);
        this.erreur.set(null);
      }
    });
    interroger(
      () => this.charger(),
      RAFRAICHISSEMENT_MS,
      () => this.compte.joueur() !== null,
    );
  }

  async charger(): Promise<void> {
    if (!this.compte.joueur()) return;
    this.enCours.set(true);
    try {
      const reponse = await firstValueFrom(
        this.http.get<{ aMonTour: number; duels: ResumeDuel[] }>('/api/v1/moi/duels'),
      );
      this.duels.set(reponse.duels);
      this.aMonTour.set(reponse.aMonTour);
      this.erreur.set(null);
    } catch (erreur) {
      // On garde la dernière liste connue ; sans elle, l'écran dit pourquoi et propose « Réessayer ».
      this.erreur.set(erreur);
    } finally {
      this.enCours.set(false);
    }
  }
}
