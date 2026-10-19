import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';
import { PartieEcran } from '../jeu/partie';
import type { Deck } from '../jeu/modele';
import type { Duel } from './modele';

/** Délai entre deux vérifications quand le créateur attend que son défi soit relevé. */
const ATTENTE_MS = 5000;

/**
 * Un duel : le lien de défi à partager pour son créateur, l'invitation à relever le défi pour un collègue
 * (US-033), puis, une fois le défi relevé, le plateau du duel (US-034).
 */
@Component({
  selector: 'hip-duel',
  imports: [RouterLink, PartieEcran],
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
  /** Échec de lecture : introuvable (404), expiré (410), ou panne. */
  protected readonly probleme = signal<'introuvable' | 'expire' | 'panne' | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly occupe = signal(false);
  protected readonly copie = signal(false);

  protected readonly lien = computed(() => `${this.origine}/duels/${this.id()}`);
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
    const minuterie = setInterval(() => {
      if (this.enAttente()) void this.charger();
    }, ATTENTE_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(minuterie));
  }

  protected async relever(deck: Deck): Promise<void> {
    await this.agir(async () => {
      this.duel.set(
        await firstValueFrom(
          this.http.post<Duel>(`/api/v1/duels/${this.id()}/rejoindre`, { deck: deck.id }),
        ),
      );
    });
  }

  protected async annuler(): Promise<void> {
    await this.agir(async () => {
      const ouvert = this.duel()?.ouvert;
      await firstValueFrom(this.http.delete(`/api/v1/duels/${this.id()}`));
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

  private async charger(): Promise<void> {
    try {
      this.duel.set(await firstValueFrom(this.http.get<Duel>(`/api/v1/duels/${this.id()}`)));
      this.probleme.set(null);
    } catch (erreur) {
      const statut = erreur instanceof HttpErrorResponse ? erreur.status : 0;
      const problemes: Record<number, 'introuvable' | 'expire'> = {
        404: 'introuvable',
        410: 'expire',
      };
      this.probleme.set(problemes[statut] ?? 'panne');
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
        this.erreur.set('L’API ne répond pas : réessayez dans un instant.');
      }
    } finally {
      this.occupe.set(false);
    }
  }
}
