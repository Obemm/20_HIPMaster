import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Chance d'obtenir une rareté dans un booster, telle que calculée par l'API. */
export interface ChanceRarete {
  rarete: 'commune' | 'rare' | 'epique' | 'legendaire';
  chance: number;
}

export const LIBELLES_RARETE: Record<ChanceRarete['rarete'], string> = {
  commune: 'Commune',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
};

@Component({
  selector: 'hip-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly libelles = LIBELLES_RARETE;
  /** 0.07 → 7 (évite les 7.000000000000001 des flottants). */
  protected enPourcentage(chance: number): number {
    return Math.round(chance * 1000) / 10;
  }

  protected readonly raretes = httpResource<ChanceRarete[]>(() => '/api/v1/raretes');
}
