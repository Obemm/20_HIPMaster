import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { type Carte, type Famille, LIBELLES_FAMILLE } from '../cartes/carte';
import { VignetteCarte } from '../cartes/vignette-carte';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { LIBELLES_RARETE, type Rarete, SYMBOLES_RARETE } from '../libelles';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { CollectionService } from './collection.service';

type Possession = '' | 'possedees' | 'manquantes';

/** Page « Ma collection » (US-024) : la progression du set, les cartes possédées et celles qui manquent. */
@Component({
  selector: 'hip-collection',
  imports: [RouterLink, RouterOutlet, VignetteCarte, ErreurChargement, EtatSession],
  templateUrl: './collection.html',
})
export class CollectionEcran {
  protected readonly compte = inject(CompteService);
  private readonly collection = inject(CollectionService);

  protected readonly familles = Object.entries(LIBELLES_FAMILLE) as [Famille, string][];
  protected readonly raretes = Object.entries(LIBELLES_RARETE) as [Rarete, string][];
  protected readonly symbolesRarete = SYMBOLES_RARETE;

  protected readonly cartes = httpResource<Carte[]>(() => '/api/v1/cartes');
  protected readonly famille = signal<Famille | ''>('');
  protected readonly rarete = signal<Rarete | ''>('');
  protected readonly possession = signal<Possession>('');

  /** Ce qui empêche d'afficher la collection : le catalogue, ou les exemplaires du joueur (US-055). */
  protected readonly echec = computed(
    () => this.cartes.error() ?? (this.collection.exemplaires() ? null : this.collection.erreur()),
  );
  protected readonly nouvelEssai = computed(
    () => this.cartes.isLoading() || this.collection.enCours(),
  );

  /** Toutes les cartes du set, avec leurs exemplaires (0 si elle manque). */
  private readonly lignes = computed(() => {
    const exemplaires = this.collection.exemplaires();
    if (!this.cartes.hasValue() || !exemplaires) return null;
    return this.cartes
      .value()
      .map((carte) => ({ carte, exemplaires: exemplaires.get(carte.numero) ?? 0 }));
  });

  protected readonly progression = computed(() => {
    const lignes = this.lignes();
    if (!lignes) return null;
    const parRarete = this.raretes.map(([rarete, libelle]) => {
      const duRang = lignes.filter((l) => l.carte.rarete === rarete);
      return {
        rarete,
        libelle,
        obtenues: duRang.filter((l) => l.exemplaires > 0).length,
        total: duRang.length,
      };
    });
    return {
      obtenues: lignes.filter((l) => l.exemplaires > 0).length,
      total: lignes.length,
      parRarete,
    };
  });

  protected readonly affichees = computed(() => {
    const famille = this.famille();
    const rarete = this.rarete();
    const possession = this.possession();
    return (this.lignes() ?? []).filter(
      ({ carte, exemplaires }) =>
        (!famille || carte.famille === famille) &&
        (!rarete || carte.rarete === rarete) &&
        (possession !== 'possedees' || exemplaires > 0) &&
        (possession !== 'manquantes' || exemplaires === 0),
    );
  });

  /** « Réessayer » : relit ce qui a manqué, le catalogue ou les exemplaires. */
  protected reessayer(): void {
    if (this.cartes.error()) this.cartes.reload();
    if (!this.collection.exemplaires()) void this.collection.charger();
  }

  protected choisirFamille(evenement: Event): void {
    this.famille.set((evenement.target as HTMLSelectElement).value as Famille | '');
  }

  protected choisirRarete(evenement: Event): void {
    this.rarete.set((evenement.target as HTMLSelectElement).value as Rarete | '');
  }

  protected choisirPossession(evenement: Event): void {
    this.possession.set((evenement.target as HTMLSelectElement).value as Possession);
  }
}
