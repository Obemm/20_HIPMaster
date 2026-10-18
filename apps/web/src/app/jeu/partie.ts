import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  afterRenderEffect,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  type OnDestroy,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Carte } from '../cartes/carte';
import { VignetteCarte } from '../cartes/vignette-carte';
import { Icone } from '../icone';
import { decrireComposant, JetonComposant } from './jeton-composant';
import type { Duel } from '../duels/modele';
import { type Adversaire, adversaireNomme, BOT, decrireEvenement } from './journal';
import { RegleCourte } from './regle-courte';
import {
  type Action,
  type Composant,
  type Evenement,
  type Niveau,
  type Partie,
  TOURS_MAX,
} from './modele';
import { CompteService } from '../compte/compte.service';

type ActionCarte = Extract<Action, { carte: string }>;

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
  imports: [RouterLink, VignetteCarte, JetonComposant, Icone, RegleCourte],
  templateUrl: './partie.html',
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
  private readonly titreFin = viewChild<ElementRef<HTMLElement>>('titreFin');
  /** Événements reçus, pas encore affichés : ils passent un par un, toujours dans l'ordre. */
  private readonly enAttente: Evenement[] = [];
  private minuterie: ReturnType<typeof setTimeout> | null = null;
  private interrogation: ReturnType<typeof setInterval> | null = null;
  /** En duel : version (ETag) et curseur du journal de la dernière réponse, et pseudo de l'adversaire. */
  private version = -1;
  private curseur = 0;
  protected readonly pseudoAdversaire = signal<string | null>(null);
  protected readonly autre = computed<Adversaire>(() => {
    if (this.mode() !== 'duel') return BOT;
    return adversaireNomme(this.pseudoAdversaire() ?? 'votre adversaire');
  });

  protected readonly TOURS_MAX = TOURS_MAX;
  protected readonly decrireComposant = decrireComposant;

  protected readonly partie = signal<Partie | null>(null);
  protected readonly introuvable = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly occupe = signal(false);
  /** Événements déjà affichés ; le journal en est déduit, avec les noms du catalogue dès qu'il est chargé. */
  private readonly evenements = signal<Evenement[]>([]);
  protected readonly journal = computed(() => {
    this.cartes();
    const joueur = this.vue()?.joueur ?? 'j1';
    return this.evenements()
      .map((e) => decrireEvenement(e, joueur, this.nommer, this.autre()))
      .filter((ligne): ligne is string => ligne !== null);
  });
  /** L'aide « Comment jouer ? » est ouverte en début de partie, repliable ensuite. */
  protected reglesOuvertes = false;
  protected readonly carteChoisie = signal<string | null>(null);
  protected readonly attaquant = signal<string | null>(null);

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
  protected readonly monTour = computed(() => {
    const vue = this.vue();
    return vue !== null && vue.actif === vue.joueur && !vue.issue;
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
  }

  ngOnInit(): void {
    void this.charger();
    if (this.mode() === 'duel') {
      this.interrogation = setInterval(() => void this.actualiserDuel(), INTERROGATION_DUEL_MS);
    }
  }

  ngOnDestroy(): void {
    if (this.minuterie) clearTimeout(this.minuterie);
    if (this.interrogation) clearInterval(this.interrogation);
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
    this.carteChoisie.update((actuelle) => (actuelle === id ? null : id));
  }

  protected choisirAttaquant(composant: Composant): void {
    if (!this.attaquantsPossibles().has(composant.id)) return;
    this.carteChoisie.set(null);
    this.attaquant.update((actuel) => (actuel === composant.id ? null : composant.id));
  }

  protected attaquer(cible: string): void {
    const attaquant = this.attaquant();
    if (attaquant && this.ciblesPossibles().has(cible)) {
      void this.jouer({ type: 'attaquer', attaquant, cible });
    }
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
                this.http.post<Duel>(`/api/v1/duels/${this.id()}/actions`, action, {
                  headers: { 'If-Match': `"${this.version}"` },
                }),
              ),
            )
          : await firstValueFrom(
              this.http.post<Partie>(`/api/v1/parties/${this.id()}/actions`, action),
            );
      this.carteChoisie.set(null);
      this.attaquant.set(null);
      this.recevoir(partie, true);
    } catch (erreur) {
      this.signalerErreur(erreur);
    } finally {
      this.occupe.set(false);
    }
  }

  private async charger(): Promise<void> {
    try {
      const partie =
        this.mode() === 'duel'
          ? this.depuisDuel(await firstValueFrom(this.http.get<Duel>(`/api/v1/duels/${this.id()}`)))
          : await firstValueFrom(this.http.get<Partie>(`/api/v1/parties/${this.id()}`));
      this.reglesOuvertes = partie.vue.moi.tours <= 1;
      this.recevoir(partie, false);
    } catch (erreur) {
      this.signalerErreur(erreur);
    }
  }

  /**
   * En duel, pendant le tour de l'adversaire : redemande le duel, sauf si l'onglet est caché. L'API répond 304 si
   * rien n'a changé ; sinon les coups de l'adversaire défilent dans le journal comme ceux du bot.
   */
  private async actualiserDuel(): Promise<void> {
    const vue = this.vue();
    if (!vue || vue.issue || this.monTour() || this.occupe()) return;
    if (globalThis.document?.visibilityState === 'hidden') return;
    try {
      const duel = await firstValueFrom(
        this.http.get<Duel>(`/api/v1/duels/${this.id()}`, {
          params: { depuis: this.curseur },
          headers: { 'If-None-Match': `"${this.version}"` },
        }),
      );
      this.recevoir(this.depuisDuel(duel), true);
    } catch {
      // 304 (rien de neuf) ou réseau momentanément indisponible : on réessaiera au prochain passage.
    }
  }

  /** Un duel vu comme une partie, pour réutiliser tout l'écran ; retient version, curseur et adversaire. */
  private depuisDuel(duel: Duel): Partie {
    if (!duel.vue) throw new Error('Le duel n’a pas commencé.');
    this.version = duel.version;
    this.curseur = duel.curseur;
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
      this.erreur.set('L’API ne répond pas : réessayez dans un instant.');
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
