import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_RARETE, type Rarete } from '../libelles';
import { ErreurChargement } from '../reseau/erreur-chargement';

/** Chance d'obtenir une rareté dans un booster, telle que calculée par l'API. */
export interface ChanceRarete {
  rarete: Rarete;
  chance: number;
}

@Component({
  selector: 'hip-accueil',
  imports: [RouterLink, ErreurChargement],
  templateUrl: './accueil.html',
})
export class Accueil {
  protected readonly libelles = LIBELLES_RARETE;
  /** 0.07 → 7 (évite les 7.000000000000001 des flottants). */
  protected enPourcentage(chance: number): number {
    return Math.round(chance * 1000) / 10;
  }

  protected readonly raretes = httpResource<ChanceRarete[]>(() => '/api/v1/raretes');
}
