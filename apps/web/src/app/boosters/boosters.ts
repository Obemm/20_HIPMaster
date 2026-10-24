import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Carte } from '../cartes/carte';
import { DosCarte } from '../cartes/dos-carte';
import { VignetteCarte } from '../cartes/vignette-carte';
import { CollectionService } from '../collection/collection.service';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { PresenceService } from '../presence';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { LIBELLES_RARETE, SYMBOLES_RARETE } from '../libelles';
import { expliquer } from '../reseau/reseau';
import { ChancesBooster } from './chances-booster';
import { PaquetBooster } from './paquet-booster';
import { StockBoostersService } from './stock-boosters.service';

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
 *
 * L'ouverture est un moment (US-062) : les paquets en stock se voient, les cartes arrivent face cachée avec leur
 * rareté au dos, et se retournent une à une, ou toutes d'un coup. Le tirage est fait par le serveur avant la mise en
 * scène (ADR 0019) : elle n'y change rien.
 */
@Component({
  selector: 'hip-boosters',
  imports: [
    RouterLink,
    VignetteCarte,
    DosCarte,
    PaquetBooster,
    ErreurChargement,
    EtatSession,
    ChancesBooster,
  ],
  templateUrl: './boosters.html',
})
export class BoostersEcran {
  protected readonly compte = inject(CompteService);
  private readonly http = inject(HttpClient);
  private readonly collection = inject(CollectionService);
  private readonly presence = inject(PresenceService);
  /** Le stock affiché dans la navigation (US-060), tenu à jour par chaque lecture de cette page. */
  private readonly stockNavigation = inject(StockBoostersService);

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
  /** Rangs des cartes déjà retournées (US-062). */
  private readonly retournees = signal<ReadonlySet<number>>(new Set());
  protected readonly revelees = computed(() =>
    this.tirage().flatMap((tiree, rang) => {
      const carte = this.parNumero().get(tiree.numero);
      return carte
        ? [{ carte, nouvelle: tiree.nouvelle, rang, retournee: this.retournees().has(rang) }]
        : [];
    }),
  );
  protected readonly nouvelles = computed(() => this.tirage().filter((c) => c.nouvelle).length);
  protected readonly toutesRetournees = computed(
    () => this.tirage().length > 0 && this.retournees().size === this.tirage().length,
  );
  /** Ce que vient de montrer le dernier retournement, pour les lecteurs d'écran. */
  protected readonly annonce = signal('');
  protected readonly libellesRarete = LIBELLES_RARETE;
  protected readonly symbolesRarete = SYMBOLES_RARETE;
  /** Les paquets en stock à dessiner : cinq au plus, le texte dit le nombre exact. */
  protected readonly paquets = computed(() =>
    Array.from({ length: Math.min(this.boosters()?.stock ?? 0, 5) }, (_, i) => i),
  );
  private readonly injecteur = inject(Injector);
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
      this.retournees.set(new Set());
      this.tirage.set(ouverture.cartes);
      this.annonce.set(`Booster ouvert : ${ouverture.cartes.length} cartes, face cachée.`);
      this.focaliser('#carte-cachee-0');
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

  /** Retourne une carte du tirage ; le focus passe à la suivante encore cachée, ou au bilan. */
  protected retourner(rang: number): void {
    const r = this.revelees().find((carte) => carte.rang === rang);
    if (!r || r.retournee) return;
    this.retournees.update((rangs) => new Set([...rangs, rang]));
    const rarete = LIBELLES_RARETE[r.carte.rarete].toLowerCase();
    this.annonce.set(
      `Carte ${rang + 1} : ${r.carte.nom}, ${rarete}${r.nouvelle ? ', nouvelle !' : '.'}`,
    );
    const suivante = this.revelees().find((carte) => !carte.retournee);
    this.focaliser(suivante ? `#carte-cachee-${suivante.rang}` : '#titre-tirage');
  }

  /** « Tout révéler » : pour le joueur pressé, les cartes restantes d'un coup. */
  protected toutRetourner(): void {
    this.retournees.set(new Set(this.tirage().map((_, rang) => rang)));
    this.annonce.set('');
    this.focaliser('#titre-tirage');
  }

  private focaliser(selecteur: string): void {
    afterNextRender(() => globalThis.document?.querySelector<HTMLElement>(selecteur)?.focus(), {
      injector: this.injecteur,
    });
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
    this.stockNavigation.retenir(boosters);
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
