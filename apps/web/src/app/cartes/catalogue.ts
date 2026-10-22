import { httpResource } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LIBELLES_RARETE, type Rarete, SYMBOLES_RARETE } from '../libelles';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { type Carte, type Famille, LIBELLES_FAMILLE } from './carte';
import { VignetteCarte } from './vignette-carte';

/** Catalogue du set 1. Le détail d'une carte s'ouvre par-dessus (route enfant), sans perdre les filtres. */
@Component({
  selector: 'hip-catalogue',
  imports: [RouterLink, RouterOutlet, VignetteCarte, ErreurChargement],
  templateUrl: './catalogue.html',
})
export class Catalogue {
  protected readonly familles = Object.entries(LIBELLES_FAMILLE) as [Famille, string][];
  protected readonly raretes = Object.entries(LIBELLES_RARETE) as [Rarete, string][];
  protected readonly symbolesRarete = SYMBOLES_RARETE;

  protected readonly cartes = httpResource<Carte[]>(() => '/api/v1/cartes');
  protected readonly famille = signal<Famille | ''>('');
  protected readonly rarete = signal<Rarete | ''>('');

  protected readonly cartesAffichees = computed(() => {
    const cartes = this.cartes.hasValue() ? this.cartes.value() : [];
    const famille = this.famille();
    const rarete = this.rarete();
    return cartes.filter(
      (carte) => (!famille || carte.famille === famille) && (!rarete || carte.rarete === rarete),
    );
  });

  protected choisirFamille(evenement: Event): void {
    this.famille.set((evenement.target as HTMLSelectElement).value as Famille | '');
  }

  protected choisirRarete(evenement: Event): void {
    this.rarete.set((evenement.target as HTMLSelectElement).value as Rarete | '');
  }
}
