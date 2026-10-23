import { HttpClient } from '@angular/common/http';
import { DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';
import { PresenceService } from '../presence';
import type { Boosters } from './boosters';

/**
 * Le stock de boosters du joueur connecté, pour l'onglet « Boosters » de la navigation (US-060). Le front ne calcule
 * pas la recharge (ADR 0004, ADR 0019) : il relit le stock quand le serveur annonce le prochain booster
 * (`prochainDans`), si le joueur est là, et quand une page lui en donne un plus frais (ouverture, victoire).
 */
@Injectable({ providedIn: 'root' })
export class StockBoostersService {
  private readonly http = inject(HttpClient);
  private readonly compte = inject(CompteService);
  private readonly presence = inject(PresenceService);

  /** Boosters en stock ; `null` sans compte ou avant la première lecture. */
  readonly stock = signal<number | null>(null);
  /** Le prochain booster est arrivé : le stock sera relu dès que le joueur sera là. */
  private readonly rechargeDue = signal(false);
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      if (!this.rechargeDue() || !this.presence.present()) return;
      this.rechargeDue.set(false);
      void this.charger();
    });
    effect(() => {
      if (this.compte.joueur()) return;
      clearTimeout(this.minuterie);
      this.stock.set(null);
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuterie));
  }

  async charger(): Promise<void> {
    if (!this.compte.joueur()) return;
    try {
      this.retenir(await firstValueFrom(this.http.get<Boosters>('/api/v1/moi/boosters')));
    } catch {
      // On garde le dernier stock connu : la page « Mes boosters » dit pourquoi et propose de réessayer.
    }
  }

  /** Le stock tel que le serveur vient de le donner, et le rendez-vous de la prochaine recharge. */
  retenir(boosters: Boosters): void {
    this.stock.set(boosters.stock);
    clearTimeout(this.minuterie);
    if (boosters.prochainDans !== null) {
      this.minuterie = setTimeout(() => this.rechargeDue.set(true), boosters.prochainDans * 1000);
    }
  }
}
