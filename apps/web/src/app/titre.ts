import { effect, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { MesDuelsService } from './duels/mes-duels.service';

/**
 * Titre de l'onglet : celui de la page, précédé du nombre de duels qui attendent le joueur (« (2) Duel —
 * HIPMaster »), pour le voir depuis un autre onglet (US-035).
 */
@Injectable({ providedIn: 'root' })
export class TitreAvecDuels extends TitleStrategy {
  private readonly titre = inject(Title);
  private readonly duels = inject(MesDuelsService);
  private readonly titrePage = signal('HIPMaster');

  constructor() {
    super();
    effect(() => {
      const enAttente = this.duels.aMonTour();
      this.titre.setTitle(enAttente > 0 ? `(${enAttente}) ${this.titrePage()}` : this.titrePage());
    });
  }

  override updateTitle(etat: RouterStateSnapshot): void {
    this.titrePage.set(this.buildTitle(etat) ?? 'HIPMaster');
  }
}
