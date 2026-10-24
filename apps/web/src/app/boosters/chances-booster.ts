import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';
import { LIBELLES_RARETE, type Rarete, SYMBOLES_RARETE } from '../libelles';
import { ErreurChargement } from '../reseau/erreur-chargement';

/** Chance d'obtenir une rareté dans un booster, telle que calculée par l'API. */
export interface ChanceRarete {
  rarete: Rarete;
  chance: number;
}

/**
 * Les chances de chaque rareté dans un booster, calculées par l'API. Sur l'accueil jusqu'à US-061, elles sont
 * désormais près de ce qu'elles décrivent : l'écran des boosters, avec un compte ou sans.
 */
@Component({
  selector: 'hip-chances-booster',
  imports: [ErreurChargement],
  template: `
    <section aria-labelledby="titre-raretes" class="panneau flex flex-col gap-3 p-4">
      <h2 id="titre-raretes" class="text-lg font-bold">Chances par booster</h2>
      @if (raretes.hasValue()) {
        <ul class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          @for (r of raretes.value(); track r.rarete) {
            <li
              class="rounded-xl border-2 border-cadre bg-fond-carte px-3 py-2"
              [class]="'cadre-' + r.rarete"
            >
              <span class="block text-sm font-semibold"
                >{{ symboles[r.rarete] }} {{ libelles[r.rarete] }}</span
              >
              <span class="font-titre text-2xl font-extrabold"
                >{{ enPourcentage(r.chance) }} %</span
              >
            </li>
          }
        </ul>
      } @else if (raretes.error()) {
        <hip-erreur-chargement
          quoi="Les chances par booster n’ont pas pu être chargées."
          [erreur]="raretes.error()"
          [enCours]="raretes.isLoading()"
          (reessayer)="raretes.reload()"
        />
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class ChancesBooster {
  protected readonly libelles = LIBELLES_RARETE;
  protected readonly symboles = SYMBOLES_RARETE;
  /** 0.07 → 7 (évite les 7.000000000000001 des flottants). */
  protected enPourcentage(chance: number): number {
    return Math.round(chance * 1000) / 10;
  }

  protected readonly raretes = httpResource<ChanceRarete[]>(() => '/api/v1/raretes');
}
