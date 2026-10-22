import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Carte } from '../cartes/carte';
import { VignetteCarte } from '../cartes/vignette-carte';
import { CollectionService } from '../collection/collection.service';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { PresenceService } from '../presence';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { expliquer } from '../reseau/reseau';

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

/**
 * Page « Mes boosters » (US-023) : le stock, la recharge, et l'ouverture qui révèle 5 cartes. Sans le catalogue, rien
 * ne s'ouvre : les cartes tirées ne pourraient pas être montrées (US-055).
 */
@Component({
  selector: 'hip-boosters',
  imports: [RouterLink, VignetteCarte, ErreurChargement, EtatSession],
  templateUrl: './boosters.html',
})
export class BoostersEcran {
  protected readonly compte = inject(CompteService);
  private readonly http = inject(HttpClient);
  private readonly collection = inject(CollectionService);
  private readonly presence = inject(PresenceService);

  protected readonly catalogue = httpResource<Carte[]>(() => '/api/v1/cartes');
  private readonly parNumero = computed(
    () =>
      new Map((this.catalogue.hasValue() ? this.catalogue.value() : []).map((c) => [c.numero, c])),
  );

  protected readonly boosters = signal<Boosters | null>(null);
  /** Lecture du stock en cours, et l'échec de la dernière (US-055). */
  protected readonly lectureStock = signal(false);
  protected readonly erreurStock = signal<unknown>(null);
  /** Une recharge est due : le stock sera relu dès que le joueur sera là. */
  private readonly rechargeDue = signal(false);
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
    // Le stock se relit à la recharge, sauf pour un onglet caché ou délaissé : il réveillerait la base gratuite
    // (ADR 0021, US-055). Il se relira au retour du joueur.
    effect(() => {
      if (!this.rechargeDue() || !this.presence.present()) return;
      this.rechargeDue.set(false);
      void this.charger();
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
          : `Le booster n’a pas pu être ouvert. ${expliquer(erreur)}`,
      );
      // Sans réponse, l'ouverture a pu aboutir quand même : le stock et la collection sont relus.
      if (!vide) void this.collection.charger();
      await this.charger();
    } finally {
      this.occupe.set(false);
    }
  }

  protected async charger(): Promise<void> {
    this.lectureStock.set(true);
    try {
      this.afficher(await firstValueFrom(this.http.get<Boosters>('/api/v1/moi/boosters')));
      this.erreurStock.set(null);
    } catch (erreur) {
      this.erreurStock.set(erreur);
    } finally {
      this.lectureStock.set(false);
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
      this.rechargeDue.set(true);
    } else {
      this.restant.set(secondes - 1);
    }
  }
}
