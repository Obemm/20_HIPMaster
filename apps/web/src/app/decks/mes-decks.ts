import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { CollectionService } from '../collection/collection.service';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { BoiteDeck } from '../jeu/boite-deck';
import type { Deck } from '../jeu/modele';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { problemeDe } from '../reseau/probleme';
import { expliquer } from '../reseau/reseau';
import { limiterACollection } from './analyse-deck';
import { MesDecksService, type MonDeck } from './mes-decks.service';

/** Le nom d'un deck dupliqué, dans la limite des 30 caractères d'un nom (contrat mes-decks.yaml). */
export function nomCopie(nom: string): string {
  const suffixe = $localize` (copie)`;
  return `${nom.slice(0, 30 - suffixe.length)}${suffixe}`;
}

/**
 * « Mes decks » (US-083) : les decks du joueur (5 au plus), à modifier, dupliquer ou supprimer, et les decks prêtés
 * à copier comme point de départ, limités aux cartes possédées.
 */
@Component({
  selector: 'hip-mes-decks',
  imports: [RouterLink, BoiteDeck, ErreurChargement, EtatSession],
  templateUrl: './mes-decks.html',
})
export class MesDecksEcran {
  protected readonly compte = inject(CompteService);
  protected readonly mesDecks = inject(MesDecksService);
  private readonly collection = inject(CollectionService);
  private readonly router = inject(Router);

  protected readonly catalogue = httpResource<Carte[]>(() => '/api/v1/cartes');
  protected readonly prets = httpResource<Deck[]>(() => '/api/v1/decks');
  /** L'action en cours (`dupliquer:<id>`, `copier:<id>`, `supprimer:<id>`), qui bloque les autres boutons. */
  protected readonly enCours = signal<string | null>(null);
  /** Le deck dont la suppression attend sa confirmation. */
  protected readonly aConfirmer = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly annonce = signal('');

  protected readonly plafond = computed(() => this.mesDecks.regles()?.decksMax ?? 5);
  protected readonly plein = computed(() => (this.mesDecks.decks()?.length ?? 0) >= this.plafond());

  /** Mes decks présentés comme les decks prêtés, en boîte de jeu : la description dit leur état. */
  protected readonly boites = computed(() => {
    const taille = this.mesDecks.regles()?.taille ?? 20;
    return (this.mesDecks.decks() ?? []).map((deck) => ({
      deck,
      boite: {
        id: deck.id,
        nom: deck.nom,
        cartes: deck.cartes,
        description: $localize`${deck.cartes.length}:nombre: / ${taille}:taille: cartes.`,
      } satisfies Deck,
    }));
  });

  /** Les decks prêtés, avec ce que la collection permet d'en copier. */
  protected readonly copies = computed(() => {
    const possedes = this.collection.exemplaires() ?? new Map<number, number>();
    return (this.prets.value() ?? []).map((pret) => ({
      pret,
      cartes: limiterACollection(pret.cartes, possedes),
    }));
  });

  protected async dupliquer(deck: MonDeck): Promise<void> {
    await this.agir(`dupliquer:${deck.id}`, async () => {
      const copie = await this.mesDecks.creer({ nom: nomCopie(deck.nom), cartes: deck.cartes });
      this.annonce.set($localize`Deck « ${copie.nom}:nom: » créé.`);
    });
  }

  /** Copie un deck prêté, limité aux cartes possédées, puis l'ouvre pour le compléter. */
  protected async copier(pret: Deck, cartes: number[]): Promise<void> {
    await this.agir(`copier:${pret.id}`, async () => {
      const deck = await this.mesDecks.creer({ nom: pret.nom, cartes });
      await this.router.navigate(['/decks', deck.id]);
    });
  }

  protected async supprimer(deck: MonDeck): Promise<void> {
    await this.agir(
      `supprimer:${deck.id}`,
      async () => {
        await this.mesDecks.supprimer(deck.id);
        this.aConfirmer.set(null);
        this.annonce.set($localize`Deck « ${deck.nom}:nom: » supprimé.`);
      },
      $localize`Le deck n’a pas pu être supprimé.`,
    );
  }

  private async agir(
    action: string,
    faire: () => Promise<void>,
    echec = $localize`Le deck n’a pas pu être enregistré.`,
  ): Promise<void> {
    this.enCours.set(action);
    this.erreur.set(null);
    this.annonce.set('');
    try {
      await faire();
    } catch (erreur) {
      this.erreur.set(
        problemeDe(erreur)?.code === 'decks-plafond'
          ? $localize`Vous avez déjà ${this.plafond()}:plafond: decks : supprimez-en un pour en créer un autre.`
          : `${echec} ${expliquer(erreur)}`,
      );
      // Un autre appareil a pu changer les decks : on les relit.
      void this.mesDecks.charger();
    } finally {
      this.enCours.set(null);
    }
  }
}
