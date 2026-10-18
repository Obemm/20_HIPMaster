import { HttpClient } from '@angular/common/http';
import { DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';

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
 * connexion et toutes les minutes (ADR 0020 : interrogation, pas de notification poussée). Le bandeau la met aussi
 * à jour à chaque navigation : le service n'injecte pas le routeur, dont la stratégie de titre dépend de lui.
 */
@Injectable({ providedIn: 'root' })
export class MesDuelsService {
  private readonly http = inject(HttpClient);
  private readonly compte = inject(CompteService);

  readonly duels = signal<ResumeDuel[] | null>(null);
  readonly aMonTour = signal(0);

  constructor() {
    effect(() => {
      if (this.compte.joueur()) void this.charger();
      else {
        this.duels.set(null);
        this.aMonTour.set(0);
      }
    });
    const minuterie = setInterval(() => {
      if (this.compte.joueur()) void this.charger();
    }, RAFRAICHISSEMENT_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(minuterie));
  }

  async charger(): Promise<void> {
    if (!this.compte.joueur()) return;
    try {
      const reponse = await firstValueFrom(
        this.http.get<{ aMonTour: number; duels: ResumeDuel[] }>('/api/v1/moi/duels'),
      );
      this.duels.set(reponse.duels);
      this.aMonTour.set(reponse.aMonTour);
    } catch {
      // Réseau indisponible : on garde la dernière liste connue, la prochaine mise à jour réessaiera.
    }
  }
}
