import { NgTemplateOutlet } from '@angular/common';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  type ElementRef,
  inject,
  Injector,
  input,
  type OnDestroy,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { type Carte, LIBELLES_FAMILLE, libelleType } from '../cartes/carte';
import { VignetteCarte } from '../cartes/vignette-carte';
import { Icone } from '../icone';
import { estUuid } from '../identifiant';
import { LIBELLES_RARETE, SYMBOLES_RARETE } from '../libelles';
import { interroger } from '../presence';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { expliquer } from '../reseau/reseau';
import { decrireComposant, JetonComposant, statutsComposant } from './jeton-composant';
import type { Duel } from '../duels/modele';
import { resteAvant } from '../duels/temps';
import { type Adversaire, adversaireNomme, BOT, decrireEvenement } from './journal';
import { RegleCourte } from './regle-courte';
import {
  type Action,
  type Composant,
  type Evenement,
  type IdJoueur,
  type Issue,
  type Niveau,
  type Partie,
  TOURS_MAX,
} from './modele';
import { CompteService } from '../compte/compte.service';
import { PreferencesService } from '../preferences';

type ActionCarte = Extract<Action, { carte: string }>;
type Attaque = Extract<Action, { type: 'attaquer' }>;

/**
 * Ce que le joueur lit en grand (US-040, US-041) : une carte de sa main, un composant en jeu (le sien ou celui de
 * l'adversaire, avec son état du moment), ou le SI adverse quand il est visé.
 */
type Detail =
  | { zone: 'main'; id: string; carte: Carte; injouable: string | null }
  | { zone: 'moi' | 'adversaire'; id: string; carte: Carte; composant: Composant }
  | { zone: 'si'; id: 'si' };

/** Délai entre deux lignes du journal quand le bot joue (aucun si l'animation est réduite). */
const DELAI_JOURNAL_MS = 250;
/** En duel, délai entre deux vérifications pendant le tour de l'adversaire (ADR 0020). */
const INTERROGATION_DUEL_MS = 3000;

/**
 * Écran d'une partie contre le bot (US-013), ou d'un duel entre joueurs (US-034, `mode` « duel »). Il affiche la
 * vue renvoyée par l'API et n'envoie que des actions de `vue.actions` : aucune règle n'est calculée ici.
 */
@Component({
  selector: 'hip-partie',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    VignetteCarte,
    JetonComposant,
    Icone,
    RegleCourte,
    ErreurChargement,
  ],
  templateUrl: './partie.html',
  // Échap replie le journal, sinon referme le détail de la carte ou du composant choisi (US-040, US-041, US-059), où
  // que soit le focus dans l'écran.
  host: { '(keydown.escape)': 'echap()' },
})
export class PartieEcran implements OnInit, OnDestroy {
  /** Paramètre de route `:id`. */
  readonly id = input.required<string>();
  /**
   * « bot » : partie contre le bot ; « duel » : duel entre joueurs, rafraîchi pendant le tour adverse. Par la
   * route, le routeur lie `undefined` à cette entrée absente : on retombe alors sur « bot ».
   */
  readonly mode = input<'bot' | 'duel', 'bot' | 'duel' | undefined>('bot', {
    transform: (valeur) => valeur ?? 'bot',
  });

  private readonly http = inject(HttpClient);
  protected readonly compte = inject(CompteService);
  private readonly preferences = inject(PreferencesService);
  private readonly injecteur = inject(Injector);
  private readonly titreFin = viewChild<ElementRef<HTMLElement>>('titreFin');
  private readonly fenetreAide = viewChild<ElementRef<HTMLDialogElement>>('fenetreAide');
  private readonly boutonJournal = viewChild<ElementRef<HTMLElement>>('boutonJournal');
  /** L'aide doit s'ouvrir d'elle-même dès qu'elle est affichée : première partie dans ce navigateur (US-059). */
  private aideAOuvrir = false;
  /** La fenêtre d'aide qui écoute déjà les clics sur son fond (elle est recréée si l'écran se réaffiche). */
  private aideEcoutee: HTMLDialogElement | null = null;
  /** Événements reçus, pas encore affichés : ils passent un par un, toujours dans l'ordre. */
  private readonly enAttente: Evenement[] = [];
  private minuterie: ReturnType<typeof setTimeout> | null = null;
  /** En duel : version (ETag) et curseur du journal de la dernière réponse, et pseudo de l'adversaire. */
  private version = -1;
  private curseur = 0;
  protected readonly pseudoAdversaire = signal<string | null>(null);
  /** En duel : échéance du coup attendu (US-036), et confirmation d'abandon en cours. */
  private readonly echeance = signal<string | null>(null);
  protected readonly confirmerAbandon = signal(false);
  protected readonly reste = computed(() => resteAvant(this.echeance()));
  protected readonly autre = computed<Adversaire>(() => {
    if (this.mode() !== 'duel') return BOT;
    return adversaireNomme(this.pseudoAdversaire() ?? 'votre adversaire');
  });

  protected readonly TOURS_MAX = TOURS_MAX;
  protected readonly decrireComposant = decrireComposant;
  protected readonly statutsComposant = statutsComposant;
  protected readonly libelleType = libelleType;
  protected readonly libellesFamille = LIBELLES_FAMILLE;
  protected readonly libellesRarete = LIBELLES_RARETE;
  protected readonly symbolesRarete = SYMBOLES_RARETE;

  protected readonly partie = signal<Partie | null>(null);
  protected readonly introuvable = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly occupe = signal(false);
  /** Lecture de la partie en cours, et son échec tant qu'aucune partie n'est affichée (US-055). */
  private readonly enLecture = signal(false);
  private readonly echecLecture = signal<unknown>(null);
  /** Événements déjà affichés ; le journal en est déduit, avec les noms du catalogue dès qu'il est chargé. */
  private readonly evenements = signal<Evenement[]>([]);
  protected readonly journal = computed(() => {
    this.cartes();
    const joueur = this.vue()?.joueur ?? 'j1';
    return this.evenements()
      .map((e) => decrireEvenement(e, joueur, this.nommer, this.autre()))
      .filter((ligne): ligne is string => ligne !== null);
  });
  /** Le journal déplié par-dessus le plateau, sur téléphone (US-059) ; au bureau, il est toujours entier. */
  protected readonly journalOuvert = signal(false);
  /** La carte de la main choisie (US-040), ou le composant du plateau choisi, `si` compris (US-041) : un seul détail. */
  protected readonly carteChoisie = signal<string | null>(null);
  protected readonly composantChoisi = signal<string | null>(null);
  /** L'attaquant désigné parmi mes composants ; l'attaque se confirme sous le détail de la cible (US-041). */
  protected readonly attaquant = signal<string | null>(null);

  /** L'adresse de la partie, ou du duel, dans l'API : l'identifiant tiré de l'URL y est encodé (US-055). */
  private readonly cheminApi = computed(
    () =>
      `/api/v1/${this.mode() === 'duel' ? 'duels' : 'parties'}/${encodeURIComponent(this.id())}`,
  );

  /** Les cartes du catalogue, par numéro. */
  private readonly catalogue = httpResource<Carte[]>(() => '/api/v1/cartes');
  private readonly cartes = computed(
    () =>
      new Map((this.catalogue.hasValue() ? this.catalogue.value() : []).map((c) => [c.numero, c])),
  );
  /** Numéro de chaque carte rencontrée dans la partie, par identifiant (« j2-05 »). */
  private readonly numeros = new Map<string, number>();

  protected readonly vue = computed(() => this.partie()?.vue ?? null);
  /** Le nom du niveau du bot adverse, pour le rappeler pendant la partie (US-021). */
  private readonly niveaux = httpResource<Niveau[]>(() => '/api/v1/niveaux');
  protected readonly nomNiveau = computed(() => {
    const id = this.partie()?.niveau;
    const niveaux = this.niveaux.hasValue() ? this.niveaux.value() : [];
    return niveaux.find((n) => n.id === id)?.nom ?? '';
  });
  protected readonly pret = computed(() => this.vue() !== null && this.catalogue.hasValue());
  /** Ce qui empêche d'afficher la partie : sa lecture ou celle du catalogue a échoué. */
  protected readonly echec = computed(() => this.echecLecture() ?? this.catalogue.error() ?? null);
  protected readonly nouvelEssai = computed(() => this.enLecture() || this.catalogue.isLoading());
  protected readonly monTour = computed(() => {
    const vue = this.vue();
    return vue !== null && vue.actif === vue.joueur && !vue.issue;
  });

  /** Ce qui est lu en grand ; rien si la carte ou le composant a quitté le jeu entre-temps. */
  protected readonly detail = computed((): Detail | null => {
    const vue = this.vue();
    if (!vue) return null;
    const main = this.carteChoisie();
    if (main) {
      const instance = vue.moi.main.find((c) => c.id === main);
      const carte = instance && this.carteDe(instance.numero);
      return carte
        ? { zone: 'main', id: main, carte, injouable: instance.injouable ?? null }
        : null;
    }
    const id = this.composantChoisi();
    if (!id) return null;
    if (id === 'si') return { zone: 'si', id };
    const mien = vue.moi.plateau.find((c) => c.id === id);
    const composant = mien ?? vue.adversaire.plateau.find((c) => c.id === id);
    const carte = composant && this.carteDe(composant.numero);
    return carte ? { zone: mien ? 'moi' : 'adversaire', id, carte, composant } : null;
  });

  /** L'attaque à confirmer : l'attaquant désigné contre la cible choisie, si le serveur la propose. */
  protected readonly attaqueChoisie = computed((): Attaque | null => {
    const attaquant = this.attaquant();
    const cible = this.composantChoisi();
    return attaquant && cible && this.ciblesPossibles().has(cible)
      ? { type: 'attaquer', attaquant, cible }
      : null;
  });

  protected readonly actionsCarte = computed((): ActionCarte[] => {
    const id = this.carteChoisie();
    return (this.vue()?.actions ?? []).filter(
      (a): a is ActionCarte => 'carte' in a && a.carte === id,
    );
  });
  private readonly attaques = computed(() =>
    (this.vue()?.actions ?? []).filter(
      (a): a is Extract<Action, { type: 'attaquer' }> => a.type === 'attaquer',
    ),
  );
  protected readonly attaquantsPossibles = computed(
    () => new Set(this.attaques().map((a) => a.attaquant)),
  );
  /**
   * Avant de finir son tour : les composants qui peuvent encore attaquer (US-039). Déduit des actions `attaquer`
   * proposées par l'API ; l'avertissement ne bloque pas la fin du tour.
   */
  protected readonly attaquesOubliees = computed(() => {
    if (!this.monTour()) return '';
    const noms = [...this.attaquantsPossibles()].map((id) => this.nommer(id));
    if (noms.length === 0) return '';
    return noms.length === 1
      ? `${noms[0]} peut encore attaquer : sélectionnez-le, puis sa cible, et confirmez.`
      : `${noms.length} composants peuvent encore attaquer (${noms.join(', ')}) : sélectionnez-les, puis leur cible, et confirmez.`;
  });
  /** La même chose en quelques mots, pour la barre d'action d'un écran de téléphone (US-059). */
  protected readonly attaquesOublieesCourt = computed(() => {
    const [premier, ...autres] = this.attaquantsPossibles();
    if (!this.monTour() || premier === undefined) return '';
    return autres.length === 0
      ? `${this.nommer(premier)} peut encore attaquer.`
      : `${autres.length + 1} composants peuvent encore attaquer.`;
  });
  protected readonly ciblesPossibles = computed(() => {
    const attaquant = this.attaquant();
    return new Set(
      this.attaques()
        .filter((a) => a.attaquant === attaquant)
        .map((a) => a.cible),
    );
  });

  /** Les composants du bot qui ont Garde (affichage seulement : le serveur décide des cibles légales). */
  protected readonly gardesAdverses = computed(() =>
    (this.vue()?.adversaire.plateau ?? [])
      .map((c) => this.carteDe(c.numero))
      .filter((carte) => carte?.capacites.some((capacite) => capacite.id === 'garde'))
      .map((carte) => carte?.nom ?? ''),
  );

  protected readonly aide = computed(() => {
    if (!this.monTour()) return '';
    if (!this.attaquant()) {
      return 'Choisissez une carte de votre main, ou un composant pour attaquer.';
    }
    if (this.attaqueChoisie()) {
      return 'Confirmez l’attaque sous le détail de la cible, ou choisissez-en une autre.';
    }
    const gardes = this.gardesAdverses();
    if (gardes.length > 0) {
      return `${this.autre().sujet} est protégé par Garde (${gardes.join(', ')}) : attaquez d’abord ce composant, son SI est inaccessible tant qu’il est en jeu.`;
    }
    return `Choisissez la cible de l’attaque : un composant ${this.autre().de} ou son SI.`;
  });

  /**
   * Les capacités des cartes visibles (plateaux et main), avec leur définition : le glossaire de la partie en cours.
   */
  protected readonly capacitesEnJeu = computed(() => {
    const vue = this.vue();
    if (!vue) return [];
    const instances = [...vue.moi.main, ...vue.moi.plateau, ...vue.adversaire.plateau];
    const parId = new Map<string, { nom: string; description: string }>();
    for (const instance of instances) {
      for (const capacite of this.carteDe(instance.numero)?.capacites ?? []) {
        const nom = capacite.nom.replace(/ \(\d+\)$/, '');
        parId.set(capacite.id, { nom, description: capacite.description });
      }
    }
    return [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  });

  constructor() {
    // En fin de partie, le focus va au résultat pour qu'il soit annoncé.
    afterRenderEffect(() => this.titreFin()?.nativeElement.focus());
    // À la première partie jouée dans ce navigateur, l'aide s'ouvre d'elle-même, une seule fois (US-059, ADR 0032).
    afterRenderEffect(() => {
      const aide = this.fenetreAide()?.nativeElement;
      if (aide && aide !== this.aideEcoutee) {
        // Clic sur le fond : équivalent souris de la touche Échap, que le `<dialog>` gère seul.
        aide.addEventListener('click', (evenement) => this.clicFondAide(evenement));
        this.aideEcoutee = aide;
      }
      if (!aide || !this.aideAOuvrir) return;
      this.aideAOuvrir = false;
      montrer(aide);
      this.preferences.marquerAideVue();
    });
    // En duel, tant que le joueur est là : onglet visible, geste depuis moins de 10 minutes (US-055).
    interroger(
      () => this.actualiserDuel(),
      INTERROGATION_DUEL_MS,
      () => this.mode() === 'duel' && this.vue() !== null && !this.vue()?.issue,
    );
  }

  ngOnInit(): void {
    void this.charger();
  }

  ngOnDestroy(): void {
    if (this.minuterie) clearTimeout(this.minuterie);
  }

  protected carteDe(numero: number): Carte | undefined {
    return this.cartes().get(numero);
  }

  protected nommer = (id: string): string => {
    const numero = this.numeros.get(id);
    return (numero !== undefined && this.carteDe(numero)?.nom) || 'une carte';
  };

  protected choisirCarte(id: string): void {
    this.attaquant.set(null);
    this.composantChoisi.set(null);
    this.carteChoisie.update((actuelle) => (actuelle === id ? null : id));
    if (this.carteChoisie()) this.focaliserDetail('titre-detail-main');
  }

  /**
   * Sélectionne un composant du plateau (ou le SI adverse) pour le lire en grand : la sélection ne joue jamais
   * (US-041). Un de mes composants qui peut attaquer devient aussi l'attaquant désigné ; le toucher de nouveau le
   * désélectionne, attaque comprise.
   */
  protected choisirComposant(id: string, camp: 'moi' | 'adversaire'): void {
    this.carteChoisie.set(null);
    if (this.composantChoisi() === id) {
      this.composantChoisi.set(null);
      if (this.attaquant() === id) this.attaquant.set(null);
      return;
    }
    this.composantChoisi.set(id);
    if (camp === 'moi') this.attaquant.set(this.attaquantsPossibles().has(id) ? id : null);
    this.focaliserDetail('titre-detail-plateau');
  }

  /**
   * Le détail s'affiche en feuille au bas de l'écran, par-dessus la main (US-059) : le focus y passe, pour que la
   * feuille ne cache pas l'élément qui l'a. Fermer le détail le rend à la carte ou au jeton choisi.
   */
  private focaliserDetail(titre: string): void {
    afterNextRender(() => globalThis.document?.getElementById(titre)?.focus(), {
      injector: this.injecteur,
    });
  }

  /** Échap : replie d'abord le journal déplié, sinon referme le détail ; l'aide se ferme seule (`<dialog>`). */
  protected echap(): void {
    if (this.fenetreAide()?.nativeElement.open) return;
    if (this.journalOuvert()) {
      this.journalOuvert.set(false);
      this.boutonJournal()?.nativeElement.focus();
      return;
    }
    this.fermerDetail();
  }

  protected basculerJournal(): void {
    this.journalOuvert.update((ouvert) => !ouvert);
  }

  /** Le bouton « ? » de l'en-tête rouvre l'aide à tout moment. */
  protected ouvrirAide(): void {
    const aide = this.fenetreAide()?.nativeElement;
    if (aide) montrer(aide);
  }

  protected fermerAide(): void {
    const aide = this.fenetreAide()?.nativeElement;
    if (!aide) return;
    if (typeof aide.close === 'function') aide.close();
    else aide.removeAttribute('open');
  }

  /** Un clic sur le fond de l'aide (hors de son contenu) a pour cible le `<dialog>` lui-même : il la ferme. */
  private clicFondAide(evenement: MouseEvent): void {
    if (evenement.target === this.fenetreAide()?.nativeElement) this.fermerAide();
  }

  /** Referme le détail et rend le focus à la carte de la main ou au jeton choisi (US-040, US-041). */
  protected fermerDetail(): void {
    const main = this.carteChoisie();
    const composant = this.composantChoisi();
    let cible: string | null = null;
    if (main) cible = `main-${main}`;
    else if (composant) cible = `plateau-${composant}`;
    if (!cible) return;
    this.carteChoisie.set(null);
    this.composantChoisi.set(null);
    globalThis.document?.getElementById(cible)?.focus();
  }

  /** « Attaquer avec API REST » : le libellé du bouton qui confirme l'attaque choisie. */
  protected libelleAttaque(attaque: Attaque): string {
    return `Attaquer avec ${this.nommer(attaque.attaquant)}`;
  }

  protected libelleAction(action: ActionCarte): string {
    const vue = this.vue();
    const instance = vue?.moi.main.find((c) => c.id === action.carte);
    const carte = instance ? this.carteDe(instance.numero) : undefined;
    switch (action.type) {
      case 'poser':
        return action.cible
          ? `Poser et renforcer ${this.nommer(action.cible)} (${carte?.cout ?? 0} Débit)`
          : `Poser (${carte?.cout ?? 0} Débit)`;
      case 'evoluer':
        return `Faire évoluer ${this.nommer(action.origine)} (${carte?.cout ?? 0} Débit)`;
      case 'decommissionner':
        return `Décommissionner (+${this.gainDecommission(carte)} Débit)`;
      case 'jouer':
        return this.libelleJeu(action.cibles, carte?.cout ?? 0);
      case 'router':
        return `Routage : renvoyer ${this.nommer(action.retour)} en main et poser cette carte (gratuit)`;
      case 'migrer':
        return `Migrer ${this.nommer(action.source)} vers cette carte (${Math.max(0, (carte?.cout ?? 0) - 2)} Débit)`;
    }
  }

  /** Les actions qui ne partent pas d'une carte de la main : l'Outillage (US-020). */
  protected readonly actionsOutillage = computed(() =>
    (this.vue()?.actions ?? []).filter(
      (a): a is Extract<Action, { type: 'outiller' }> => a.type === 'outiller',
    ),
  );

  /** « Jouer (2 Débit) », « Jouer sur Adaptateur SAP (2 Débit) », « Jouer sur SOAP / WSDL et EDI (3 Débit) ». */
  private libelleJeu(cibles: readonly string[], cout: number): string {
    if (cibles.length === 0) return `Jouer (${cout} Débit)`;
    const noms = cibles.map((id) => (id === 'si' ? `le SI ${this.autre().de}` : this.nommer(id)));
    return `Jouer sur ${noms.join(' et ')} (${cout} Débit)`;
  }

  private gainDecommission(carte: Carte | undefined): number {
    if (carte?.rarete === 'legendaire') return 3;
    return carte?.rarete === 'epique' ? 2 : 1;
  }

  protected async jouer(action: Action): Promise<void> {
    if (this.occupe()) return;
    this.occupe.set(true);
    this.erreur.set(null);
    try {
      const partie =
        this.mode() === 'duel'
          ? this.depuisDuel(
              await firstValueFrom(
                this.http.post<Duel>(`${this.cheminApi()}/actions`, action, {
                  headers: { 'If-Match': `"${this.version}"` },
                }),
              ),
            )
          : await firstValueFrom(this.http.post<Partie>(`${this.cheminApi()}/actions`, action));
      this.carteChoisie.set(null);
      this.composantChoisi.set(null);
      this.attaquant.set(null);
      this.recevoir(partie, true);
    } catch (erreur) {
      this.signalerErreur(erreur);
    } finally {
      this.occupe.set(false);
    }
  }

  /** « Réessayer » après un chargement en échec : relit ce qui manque, la partie ou le catalogue. */
  protected reessayer(): void {
    if (this.catalogue.error()) this.catalogue.reload();
    if (this.echecLecture()) void this.charger();
  }

  private async charger(): Promise<void> {
    // Un identifiant qui n'a pas la forme d'un UUID ne désigne aucune partie : rien n'est demandé à l'API (US-055).
    if (!estUuid(this.id())) {
      this.introuvable.set(true);
      return;
    }
    this.enLecture.set(true);
    try {
      const partie =
        this.mode() === 'duel'
          ? this.depuisDuel(await firstValueFrom(this.http.get<Duel>(this.cheminApi())))
          : await firstValueFrom(this.http.get<Partie>(this.cheminApi()));
      this.echecLecture.set(null);
      if (!this.preferences.aideVue()) this.aideAOuvrir = true;
      this.recevoir(partie, false);
    } catch (erreur) {
      if (erreur instanceof HttpErrorResponse && erreur.status === 404) this.introuvable.set(true);
      else if (this.partie()) this.erreur.set(expliquer(erreur));
      else this.echecLecture.set(erreur);
    } finally {
      this.enLecture.set(false);
    }
  }

  /**
   * En duel : redemande le duel. L'API répond 304 si rien n'a changé ; sinon les coups de l'adversaire défilent dans
   * le journal comme ceux du bot. Aussi pendant son propre tour : l'adversaire peut abandonner, ou le forfait tomber
   * (US-036).
   */
  private async actualiserDuel(): Promise<void> {
    const vue = this.vue();
    if (!vue || vue.issue || this.occupe()) return;
    try {
      const duel = await firstValueFrom(
        this.http.get<Duel>(this.cheminApi(), {
          params: { depuis: this.curseur },
          headers: { 'If-None-Match': `"${this.version}"` },
        }),
      );
      this.recevoir(this.depuisDuel(duel), true);
    } catch {
      // 304 (rien de neuf) ou réseau momentanément indisponible : on réessaiera au prochain passage.
    }
  }

  /** Abandonne le duel, après confirmation à l'écran (US-036) : l'adversaire gagne. */
  protected async abandonner(): Promise<void> {
    if (this.occupe()) return;
    this.occupe.set(true);
    this.erreur.set(null);
    try {
      const duel = await firstValueFrom(this.http.post<Duel>(`${this.cheminApi()}/abandon`, null));
      this.confirmerAbandon.set(false);
      this.recevoir(this.depuisDuel(duel), false);
    } catch (erreur) {
      this.signalerErreur(erreur);
    } finally {
      this.occupe.set(false);
    }
  }

  /** Comment la partie s'est terminée, du point de vue du joueur. */
  protected raisonFin(issue: Issue, joueur: IdJoueur): string {
    const gagne = issue.gagnant === joueur;
    switch (issue.raison) {
      case 'sla':
        return 'Un SI est tombé à 0 de SLA.';
      case 'tours':
        return 'Les 20 tours sont joués : le meilleur SLA l’emporte.';
      case 'abandon':
        return gagne ? `${this.autre().sujet} a abandonné.` : 'Vous avez abandonné.';
      case 'forfait':
        return gagne
          ? `${this.autre().sujet} n’a pas joué à temps : forfait.`
          : 'Vous n’avez pas joué à temps : forfait.';
    }
  }

  /** Un duel vu comme une partie, pour réutiliser tout l'écran ; retient version, curseur et adversaire. */
  private depuisDuel(duel: Duel): Partie {
    if (!duel.vue) throw new Error('Le duel n’a pas commencé.');
    this.version = duel.version;
    this.curseur = duel.curseur;
    this.echeance.set(duel.echeance);
    this.pseudoAdversaire.set(
      duel.moi === 'j1' ? (duel.adversaire?.pseudo ?? null) : duel.createur.pseudo,
    );
    return {
      id: duel.id,
      deck: '',
      deckAdversaire: '',
      niveau: '',
      vue: duel.vue,
      evenements: duel.evenements,
      ...(duel.recompense && { recompense: duel.recompense }),
    };
  }

  private signalerErreur(erreur: unknown): void {
    if (erreur instanceof HttpErrorResponse && erreur.status === 409 && this.mode() === 'duel') {
      // Le duel a bougé entre-temps (autre onglet) : on le recharge.
      this.erreur.set('Le duel a changé entre-temps : il vient d’être rechargé.');
      this.evenements.set([]);
      void this.charger();
    } else if (erreur instanceof HttpErrorResponse && erreur.status === 404) {
      this.introuvable.set(true);
    } else if (erreur instanceof HttpErrorResponse && erreur.status === 422) {
      this.erreur.set((erreur.error as { detail?: string } | null)?.detail ?? 'Action refusée.');
    } else {
      this.erreur.set(expliquer(erreur));
    }
  }

  /**
   * Met à jour la partie et ajoute ses événements au journal. Si `animer`, seuls les événements de cette réponse
   * défilent un par un : ce qui restait à afficher d'une réponse précédente est affiché d'un coup, pour que le
   * journal ne prenne jamais de retard sur le plateau.
   */
  private recevoir(partie: Partie, animer: boolean): void {
    this.retenirNumeros(partie);
    this.partie.set(partie);
    if (this.minuterie) clearTimeout(this.minuterie);
    this.minuterie = null;
    const enRetard = this.enAttente.splice(0);
    const reduit = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;
    if (!animer || reduit) {
      this.evenements.update((liste) => [...liste, ...enRetard, ...partie.evenements]);
      return;
    }
    this.evenements.update((liste) => [...liste, ...enRetard]);
    this.enAttente.push(...partie.evenements);
    this.afficherSuivant();
  }

  private afficherSuivant(): void {
    const evenement = this.enAttente.shift();
    if (!evenement) {
      this.minuterie = null;
      return;
    }
    this.evenements.update((liste) => [...liste, evenement]);
    this.minuterie = setTimeout(() => this.afficherSuivant(), DELAI_JOURNAL_MS);
  }

  private retenirNumeros(partie: Partie): void {
    const { moi, adversaire } = partie.vue;
    const instances = [
      ...moi.main,
      ...moi.plateau,
      ...moi.defausse,
      ...adversaire.plateau,
      ...adversaire.defausse,
    ];
    const depuisEvenements = partie.evenements.flatMap((e: Evenement) =>
      [e.carte, e.origine].filter((c) => typeof c === 'object' && c !== null),
    );
    for (const instance of [...instances, ...depuisEvenements]) {
      if (instance && typeof instance === 'object') this.numeros.set(instance.id, instance.numero);
    }
  }
}

/** Ouvre une fenêtre modale ; jsdom (tests unitaires) ne connaît pas `showModal`. */
function montrer(dialogue: HTMLDialogElement): void {
  if (typeof dialogue.showModal !== 'function') dialogue.setAttribute('open', '');
  else if (!dialogue.open) dialogue.showModal();
}
