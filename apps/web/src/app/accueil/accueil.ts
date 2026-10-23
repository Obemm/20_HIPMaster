import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StockBoostersService } from '../boosters/stock-boosters.service';
import { type Carte, type Famille, ILLUSTRATIONS_FAMILLE, LIBELLES_FAMILLE } from '../cartes/carte';
import { cartesVedettes, EventailCartes } from '../cartes/eventail-cartes';
import { CollectionService } from '../collection/collection.service';
import { CompteService } from '../compte/compte.service';
import { MesDuelsService } from '../duels/mes-duels.service';
import { Icone } from '../icone';

/**
 * L'accueil (US-061) : on comprend en un coup d'œil que c'est un jeu de cartes (trois cartes en éventail, la promesse
 * en une phrase) et on a envie d'y jouer (un appel à jouer, en or). Un visiteur voit comment on joue ; un joueur
 * connecté retrouve ses duels, ses boosters et sa collection. Avec un lien d'invitation (`?invitation=`), l'action
 * principale devient « Créer mon compte ».
 */
@Component({
  selector: 'hip-accueil',
  imports: [RouterLink, EventailCartes, Icone],
  templateUrl: './accueil.html',
})
export class Accueil {
  protected readonly compte = inject(CompteService);
  protected readonly stock = inject(StockBoostersService);
  protected readonly duels = inject(MesDuelsService);
  private readonly collection = inject(CollectionService);

  /** Paramètre `?invitation=` : le code d'un lien d'invitation, transmis à « Mon compte ». */
  readonly invitation = input<string>();
  protected readonly codeInvitation = computed(() => this.invitation()?.trim() || null);

  protected readonly catalogue = httpResource<Carte[]>(() => '/api/v1/cartes');
  protected readonly vedettes = computed(() =>
    this.catalogue.hasValue() ? cartesVedettes(this.catalogue.value()) : undefined,
  );

  /** Cartes du set obtenues par le joueur connecté, une fois sa collection et le catalogue chargés. */
  protected readonly progression = computed(() => {
    const exemplaires = this.collection.exemplaires();
    if (!exemplaires || !this.catalogue.hasValue()) return null;
    const cartes = this.catalogue.value();
    const obtenues = cartes.filter((c) => (exemplaires.get(c.numero) ?? 0) > 0).length;
    return { obtenues, total: cartes.length };
  });

  protected readonly familles = (Object.keys(LIBELLES_FAMILLE) as Famille[]).map((famille) => ({
    famille,
    libelle: LIBELLES_FAMILLE[famille],
    fond: ILLUSTRATIONS_FAMILLE[famille],
  }));
}
