import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_RARETE, SYMBOLES_RARETE } from '../libelles';
import { type Carte, LIBELLES_FAMILLE, LISERES_FAMILLE, libelleType } from './carte';

@Component({
  selector: 'hip-detail-carte',
  imports: [RouterLink],
  templateUrl: './detail-carte.html',
})
export class DetailCarte {
  /** Paramètre de route `:numero`, lié par `withComponentInputBinding()`. */
  readonly numero = input.required<string>();

  protected readonly libellesFamille = LIBELLES_FAMILLE;
  protected readonly liseres = LISERES_FAMILLE;
  protected readonly libellesRarete = LIBELLES_RARETE;
  protected readonly symbolesRarete = SYMBOLES_RARETE;
  protected readonly libelleType = libelleType;

  protected readonly carte = httpResource<Carte>(
    () => `/api/v1/cartes/${encodeURIComponent(this.numero())}`,
  );

  /** La carte d'origine d'une évolution, pour afficher son nom. */
  protected readonly origine = httpResource<Carte>(() => {
    const origine = this.carte.hasValue() ? this.carte.value().origine : undefined;
    return origine === undefined ? undefined : `/api/v1/cartes/${origine}`;
  });

  protected readonly introuvable = computed(() => {
    const erreur = this.carte.error();
    return erreur instanceof HttpErrorResponse && [400, 404].includes(erreur.status);
  });
}
