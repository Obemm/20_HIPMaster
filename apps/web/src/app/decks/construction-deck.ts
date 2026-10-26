import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { type Carte, type Famille, LIBELLES_FAMILLE } from '../cartes/carte';
import { CollectionService } from '../collection/collection.service';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { Icone } from '../icone';
import { LIBELLES_RARETE, type Rarete, SYMBOLES_RARETE } from '../libelles';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { problemeDe } from '../reseau/probleme';
import { expliquer } from '../reseau/reseau';
import {
  avertissements,
  compter,
  COUT_MAX_COURBE,
  courbeCout,
  exemplairesPermis,
  messageProbleme,
  repartitionFamilles,
} from './analyse-deck';
import { MesDecksService, type ProblemeDeck, type ReglesDeck } from './mes-decks.service';

/** Les règles d'avant la première lecture de « Mes decks » : le serveur les renvoie avec la liste. */
const REGLES_PAR_DEFAUT: ReglesDeck = {
  taille: 20,
  exemplairesMax: 2,
  exemplairesMaxLegendaire: 1,
  decksMax: 5,
};

/** Le paramètre de route d'un deck à créer (`/decks/nouveau`). */
export const NOUVEAU = 'nouveau';

/** Longueur maximale d'un nom de deck (contrat mes-decks.yaml). */
export const NOM_MAX = 30;

const parCoutPuisNom = (a: Carte, b: Carte) => a.cout - b.cout || a.nom.localeCompare(b.nom);

/**
 * Construction d'un deck (US-083), pensée pour le téléphone : les cartes possédées, filtrables par famille, rareté et
 * coût ; le contenu du deck ; sa courbe de coût et sa répartition par famille ; ce qui manque ou dépasse, dit pendant
 * la construction. Le serveur vérifie le deck à l'enregistrement (ADR 0004, 0048).
 */
@Component({
  selector: 'hip-construction-deck',
  imports: [RouterLink, ErreurChargement, EtatSession, Icone],
  templateUrl: './construction-deck.html',
})
export class ConstructionDeck {
  /** Paramètre de route `:id` : l'identifiant du deck, ou `nouveau` pour un deck à créer. */
  readonly id = input<string>(NOUVEAU);
  /** L'identifiant du deck enregistré ; `null` pour un nouveau deck. */
  protected readonly idDeck = computed(() => (this.id() === NOUVEAU ? null : this.id()));

  protected readonly compte = inject(CompteService);
  protected readonly mesDecks = inject(MesDecksService);
  protected readonly collection = inject(CollectionService);
  private readonly router = inject(Router);

  protected readonly familles = Object.entries(LIBELLES_FAMILLE) as [Famille, string][];
  protected readonly raretes = Object.entries(LIBELLES_RARETE) as [Rarete, string][];
  protected readonly symbolesRarete = SYMBOLES_RARETE;
  protected readonly libellesRarete = LIBELLES_RARETE;
  protected readonly libellesFamille = LIBELLES_FAMILLE;
  protected readonly couts = Array.from({ length: COUT_MAX_COURBE }, (_, i) => i + 1);
  protected readonly coutMax = COUT_MAX_COURBE;
  protected readonly nomMax = NOM_MAX;

  protected readonly catalogue = httpResource<Carte[]>(() => '/api/v1/cartes');
  protected readonly nom = signal('');
  protected readonly cartes = signal<number[]>([]);
  protected readonly famille = signal<Famille | ''>('');
  protected readonly rarete = signal<Rarete | ''>('');
  /** Le coût filtré (0 : tous) ; le dernier regroupe les cartes plus chères. */
  protected readonly cout = signal(0);
  protected readonly enregistrement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly problemes = signal<string[]>([]);
  protected readonly annonce = signal('');
  /** Le deck a été chargé dans l'éditeur (une seule fois : les modifications en cours ne sont pas écrasées). */
  private readonly initialise = signal(false);

  protected readonly regles = computed(() => this.mesDecks.regles() ?? REGLES_PAR_DEFAUT);
  protected readonly parNumero = computed(
    () => new Map((this.catalogue.value() ?? []).map((c) => [c.numero, c])),
  );
  private readonly possedes = computed(
    () => this.collection.exemplaires() ?? new Map<number, number>(),
  );

  /** Le deck enregistré qu'on modifie ; `undefined` pour un nouveau deck, `null` s'il n'existe pas (ou plus). */
  protected readonly existant = computed(() => {
    const id = this.idDeck();
    const decks = this.mesDecks.decks();
    if (!id || !decks) return undefined;
    return decks.find((d) => d.id === id) ?? null;
  });

  /** Tout est là pour construire : catalogue, collection, et le deck à modifier. */
  protected readonly pret = computed(
    () =>
      this.catalogue.hasValue() &&
      this.collection.exemplaires() !== null &&
      (!this.idDeck() || this.initialise()),
  );

  protected readonly exemplaires = computed(() => compter(this.cartes()));
  protected readonly avertissements = computed(() =>
    avertissements(this.cartes(), this.parNumero(), this.possedes(), this.regles()),
  );
  protected readonly complet = computed(
    () => this.cartes().length === this.regles().taille && this.avertissements().length === 0,
  );
  protected readonly courbe = computed(() => courbeCout(this.cartes(), this.parNumero()));
  protected readonly hauteurCourbe = computed(() =>
    Math.max(1, ...this.courbe().map((c) => c.nombre)),
  );
  protected readonly repartition = computed(() =>
    repartitionFamilles(this.cartes(), this.parNumero()),
  );

  /** Le contenu du deck, une ligne par carte, du coût le plus bas au plus haut. */
  protected readonly contenu = computed(() =>
    [...this.exemplaires()]
      .flatMap(([numero, nombre]) => {
        const carte = this.parNumero().get(numero);
        return carte ? [{ carte, nombre }] : [];
      })
      .sort((a, b) => parCoutPuisNom(a.carte, b.carte)),
  );

  /** Les cartes possédées qui passent les filtres, avec ce que le deck peut encore en prendre. */
  protected readonly disponibles = computed(() => {
    const famille = this.famille();
    const rarete = this.rarete();
    const cout = this.cout();
    const possedes = this.possedes();
    const plein = this.cartes().length >= this.regles().taille;
    return (this.catalogue.value() ?? [])
      .filter(
        (c) =>
          (possedes.get(c.numero) ?? 0) > 0 &&
          (!famille || c.famille === famille) &&
          (!rarete || c.rarete === rarete) &&
          (!cout || Math.min(c.cout, COUT_MAX_COURBE) === cout),
      )
      .sort(parCoutPuisNom)
      .map((carte) => {
        const dansDeck = this.exemplaires().get(carte.numero) ?? 0;
        const enCollection = possedes.get(carte.numero) ?? 0;
        const max = Math.min(exemplairesPermis(carte, this.regles()), enCollection);
        return { carte, dansDeck, max, enCollection, peutAjouter: !plein && dansDeck < max };
      });
  });

  constructor() {
    // Le deck à modifier, une fois connu : son nom et sa composition effective.
    effect(() => {
      const deck = this.existant();
      if (!deck || untracked(this.initialise)) return;
      this.nom.set(deck.nom);
      this.cartes.set([...deck.cartes]);
      this.initialise.set(true);
    });
  }

  protected ajouter(numero: number): void {
    this.cartes.update((cartes) => [...cartes, numero]);
    this.problemes.set([]);
  }

  /** Retire un exemplaire : le dernier ajouté. */
  protected retirer(numero: number): void {
    this.cartes.update((cartes) => {
      const index = cartes.lastIndexOf(numero);
      return index < 0 ? cartes : cartes.filter((_, i) => i !== index);
    });
    this.problemes.set([]);
  }

  protected choisirFamille(evenement: Event): void {
    this.famille.set((evenement.target as HTMLSelectElement).value as Famille | '');
  }

  protected choisirRarete(evenement: Event): void {
    this.rarete.set((evenement.target as HTMLSelectElement).value as Rarete | '');
  }

  protected choisirCout(evenement: Event): void {
    this.cout.set(Number((evenement.target as HTMLSelectElement).value));
  }

  protected saisirNom(evenement: Event): void {
    this.nom.set((evenement.target as HTMLInputElement).value);
  }

  protected async enregistrer(): Promise<void> {
    const nom = this.nom().trim();
    this.erreur.set(null);
    this.problemes.set([]);
    this.annonce.set('');
    if (!nom) {
      this.erreur.set($localize`Donnez un nom à votre deck.`);
      return;
    }
    this.enregistrement.set(true);
    try {
      const composition = { nom, cartes: this.cartes() };
      const id = this.idDeck();
      const deck = id
        ? await this.mesDecks.modifier(id, composition)
        : await this.mesDecks.creer(composition);
      this.nom.set(deck.nom);
      this.cartes.set([...deck.cartes]);
      this.initialise.set(true);
      this.annonce.set(
        deck.complet
          ? $localize`Deck « ${deck.nom}:nom: » enregistré : prêt à jouer.`
          : $localize`Deck « ${deck.nom}:nom: » enregistré, encore incomplet.`,
      );
      if (!id) await this.router.navigate(['/decks', deck.id], { replaceUrl: true });
    } catch (erreur) {
      this.signalerEchec(erreur);
    } finally {
      this.enregistrement.set(false);
    }
  }

  private signalerEchec(erreur: unknown): void {
    const probleme = problemeDe(erreur) as { code?: string; problemes?: ProblemeDeck[] } | null;
    const nom = (numero: number) => this.parNumero().get(numero)?.nom ?? `n° ${numero}`;
    if (probleme?.problemes?.length) {
      this.erreur.set($localize`Le serveur refuse ce deck :`);
      this.problemes.set(probleme.problemes.map((p) => messageProbleme(p, nom)));
      // La collection a pu changer depuis l'ouverture de l'écran.
      void this.collection.charger();
    } else if (probleme?.code === 'decks-plafond') {
      this.erreur.set(
        $localize`Vous avez déjà ${this.regles().decksMax}:plafond: decks : supprimez-en un pour enregistrer celui-ci.`,
      );
    } else if (probleme?.code === 'deck-introuvable') {
      this.erreur.set($localize`Ce deck n’existe plus : il a peut-être été supprimé ailleurs.`);
    } else {
      this.erreur.set(
        $localize`Le deck n’a pas pu être enregistré. ${expliquer(erreur)}:explication:`,
      );
    }
  }
}
