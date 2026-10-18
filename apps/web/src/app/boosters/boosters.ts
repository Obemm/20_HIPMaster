import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Carte } from '../cartes/carte';
import { VignetteCarte } from '../cartes/vignette-carte';
import { CollectionService } from '../collection/collection.service';
import { CompteService } from '../compte/compte.service';

// Contrat : apps/api/openapi/boosters.yaml.
export interface Boosters {
  stock: number;
  plafond: number;
  /** Secondes avant le prochain booster gratuit ; `null` quand le stock est plein. */
  prochainDans: number | null;
}

interface Ouverture {
  cartes: { numero: number; nouvelle: boolean }[];
  boosters: Boosters;
}

/** Page « Mes boosters » (US-023) : le stock, la recharge, et l'ouverture qui révèle 5 cartes. */
@Component({
  selector: 'hip-boosters',
  imports: [RouterLink, VignetteCarte],
  templateUrl: './boosters.html',
})
export class BoostersEcran {
  protected readonly compte = inject(CompteService);
  private readonly http = inject(HttpClient);
  private readonly collection = inject(CollectionService);

  private readonly catalogue = httpResource<Carte[]>(() => '/api/v1/cartes');
  private readonly parNumero = computed(
    () =>
      new Map((this.catalogue.hasValue() ? this.catalogue.value() : []).map((c) => [c.numero, c])),
  );

  protected readonly boosters = signal<Boosters | null>(null);
  /** Les cartes du dernier booster ouvert, avec leur fiche dès que le catalogue est chargé. */
  private readonly tirage = signal<Ouverture['cartes']>([]);
  protected readonly revelees = computed(() =>
    this.tirage().flatMap((tiree, rang) => {
      const carte = this.parNumero().get(tiree.numero);
      return carte ? [{ carte, nouvelle: tiree.nouvelle, rang }] : [];
    }),
  );
  protected readonly nouvelles = computed(() => this.tirage().filter((c) => c.nouvelle).length);
  protected readonly occupe = signal(false);
  protected readonly erreur = signal<string | null>(null);

  /** Secondes restantes avant le prochain booster, décomptées chaque seconde. */
  private readonly restant = signal<number | null>(null);
  protected readonly attente = computed(() => {
    const secondes = this.restant();
    if (secondes === null) return null;
    const minutes = Math.floor(secondes / 60);
    return minutes > 0 ? `${minutes} min ${secondes % 60} s` : `${secondes} s`;
  });

  constructor() {
    effect(() => {
      if (this.compte.joueur()) void this.charger();
    });
    const minuterie = setInterval(() => this.decompter(), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(minuterie));
  }

  protected async ouvrir(): Promise<void> {
    this.occupe.set(true);
    this.erreur.set(null);
    try {
      const ouverture = await firstValueFrom(
        this.http.post<Ouverture>('/api/v1/moi/boosters/ouvertures', null),
      );
      this.tirage.set(ouverture.cartes);
      this.afficher(ouverture.boosters);
      void this.collection.charger();
    } catch (erreur) {
      const vide = erreur instanceof HttpErrorResponse && erreur.status === 409;
      this.erreur.set(
        vide
          ? 'Plus de booster en stock : attendez la prochaine recharge.'
          : 'L’API ne répond pas : réessayez dans un instant.',
      );
      if (vide) await this.charger();
    } finally {
      this.occupe.set(false);
    }
  }

  private async charger(): Promise<void> {
    try {
      this.afficher(await firstValueFrom(this.http.get<Boosters>('/api/v1/moi/boosters')));
    } catch {
      this.erreur.set('Le stock de boosters n’a pas pu être lu.');
    }
  }

  private afficher(boosters: Boosters): void {
    this.boosters.set(boosters);
    this.restant.set(boosters.prochainDans);
  }

  private decompter(): void {
    const secondes = this.restant();
    if (secondes === null) return;
    if (secondes <= 1) {
      this.restant.set(null);
      void this.charger();
    } else {
      this.restant.set(secondes - 1);
    }
  }
}
