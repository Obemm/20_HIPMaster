import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';

/**
 * La collection du joueur connecté (US-024) : nombre d'exemplaires par numéro de carte. Chargée à la connexion,
 * oubliée à la déconnexion, rechargée après chaque booster ouvert.
 */
@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly http = inject(HttpClient);
  private readonly compte = inject(CompteService);

  /** `null` tant qu'elle n'est pas chargée (ou sans compte). */
  readonly exemplaires = signal<ReadonlyMap<number, number> | null>(null);

  constructor() {
    effect(() => {
      if (this.compte.joueur()) void this.charger();
      else this.exemplaires.set(null);
    });
  }

  async charger(): Promise<void> {
    try {
      const { cartes } = await firstValueFrom(
        this.http.get<{ cartes: { numero: number; exemplaires: number }[] }>(
          '/api/v1/moi/collection',
        ),
      );
      this.exemplaires.set(new Map(cartes.map((c) => [c.numero, c.exemplaires])));
    } catch {
      this.exemplaires.set(null);
    }
  }
}
