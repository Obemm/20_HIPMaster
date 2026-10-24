import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Carte } from '../cartes/carte';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { estUuid } from '../identifiant';
import { BoiteDeck } from '../jeu/boite-deck';
import { PartieEcran } from '../jeu/partie';
import type { Deck } from '../jeu/modele';
import { interroger } from '../presence';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { expliquer } from '../reseau/reseau';
import type { Duel } from './modele';

/** Délai entre deux vérifications quand le créateur attend que son défi soit relevé (tant qu'il est là, US-055). */
const ATTENTE_MS = 5000;

/**
 * Un duel : le lien de défi à partager pour son créateur, l'invitation à relever le défi pour un collègue
 * (US-033), puis, une fois le défi relevé, le plateau du duel (US-034).
 */
@Component({
  selector: 'hip-duel',
  imports: [RouterLink, PartieEcran, ErreurChargement, EtatSession, BoiteDeck],
  templateUrl: './duel.html',
})
export class DuelEcran {
  /** Paramètre de route `:id`. */
  readonly id = input.required<string>();

  protected readonly compte = inject(CompteService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly origine = inject(DOCUMENT).location.origin;

  protected readonly decks = httpResource<Deck[]>(() => '/api/v1/decks');
  protected readonly duel = signal<Duel | null>(null);
  /** Le catalogue, pour les cartes phares des decks, seulement quand on choisit le sien pour relever (US-068). */
  protected readonly catalogue = httpResource<Carte[]>(() => {
    const duel = this.duel();
    return duel?.statut === 'attente' && duel.moi !== 'j1' ? '/api/v1/cartes' : undefined;
  });
  /** Échec de lecture : introuvable (404, ou identifiant qui n'est pas un UUID), expiré (410), ou panne. */
  protected readonly probleme = signal<'introuvable' | 'expire' | 'panne' | null>(null);
  /** La cause d'une panne de lecture, et une lecture en cours (US-055). */
  protected readonly panne = signal<unknown>(null);
  protected readonly enLecture = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly occupe = signal(false);
  protected readonly copie = signal(false);

  /** L'adresse du duel dans l'API : l'identifiant tiré de l'URL y est encodé (US-055). */
  private readonly cheminApi = computed(() => `/api/v1/duels/${encodeURIComponent(this.id())}`);
  protected readonly lien = computed(
    () => `${this.origine}/duels/${encodeURIComponent(this.id())}`,
  );
  protected readonly nomDeck = (id: string) =>
    (this.decks.hasValue() ? this.decks.value() : []).find((d) => d.id === id)?.nom ?? id;
  /** Le créateur attend qu'un collègue relève son défi. */
  protected readonly enAttente = computed(() => {
    const duel = this.duel();
    return duel?.statut === 'attente' && duel.moi === 'j1';
  });
  constructor() {
    effect(() => {
      if (this.compte.joueur()) void this.charger();
    });
    interroger(() => this.charger(), ATTENTE_MS, this.enAttente);
  }

  protected async relever(deck: Deck): Promise<void> {
    await this.agir(async () => {
      this.duel.set(
        await firstValueFrom(
          this.http.post<Duel>(`${this.cheminApi()}/rejoindre`, { deck: deck.id }),
        ),
      );
    });
  }

  protected async annuler(): Promise<void> {
    await this.agir(async () => {
      const ouvert = this.duel()?.ouvert;
      await firstValueFrom(this.http.delete(this.cheminApi()));
      await this.router.navigate([ouvert ? '/jouer' : '/duels/nouveau']);
    });
  }

  protected async copier(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.lien());
      this.copie.set(true);
    } catch {
      this.copie.set(false);
    }
  }

  protected async charger(): Promise<void> {
    // Un identifiant qui n'a pas la forme d'un UUID ne désigne aucun duel : rien n'est demandé à l'API (US-055).
    if (!estUuid(this.id())) {
      this.probleme.set('introuvable');
      return;
    }
    this.enLecture.set(true);
    try {
      this.duel.set(await firstValueFrom(this.http.get<Duel>(this.cheminApi())));
      this.probleme.set(null);
      this.panne.set(null);
    } catch (erreur) {
      const statut = erreur instanceof HttpErrorResponse ? erreur.status : 0;
      const problemes: Record<number, 'introuvable' | 'expire'> = {
        404: 'introuvable',
        410: 'expire',
      };
      this.probleme.set(problemes[statut] ?? 'panne');
      this.panne.set(erreur);
    } finally {
      this.enLecture.set(false);
    }
  }

  private async agir(action: () => Promise<void>): Promise<void> {
    this.occupe.set(true);
    this.erreur.set(null);
    try {
      await action();
    } catch (erreur) {
      const statut = erreur instanceof HttpErrorResponse ? erreur.status : 0;
      if (statut === 409 || statut === 404 || statut === 410) {
        this.erreur.set('Ce défi n’est plus disponible : il a été relevé, annulé ou a expiré.');
        await this.charger();
      } else {
        this.erreur.set(expliquer(erreur));
      }
    } finally {
      this.occupe.set(false);
    }
  }
}
