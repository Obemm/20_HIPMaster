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
import {
  NavigationEnd,
  type Route,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { StockBoostersService } from './boosters/stock-boosters.service';
import { CompteService } from './compte/compte.service';
import { MesDuelsService } from './duels/mes-duels.service';
import { Icone, type NomIcone } from './icone';

/** Une partie ou un duel ouvert : la barre d'onglets s'efface sur téléphone pour laisser l'écran au plateau. */
const EN_PARTIE = /^\/(jouer|duels)\/(?!nouveau|hasard)[^/?#]+/;

interface Onglet {
  lien: string;
  libelle: string;
  icone: NomIcone;
}

const ONGLETS: readonly Onglet[] = [
  { lien: '/jouer', libelle: 'Jouer', icone: 'jouer' },
  { lien: '/duels', libelle: 'Duels', icone: 'duels' },
  { lien: '/boosters', libelle: 'Boosters', icone: 'boosters' },
  { lien: '/collection', libelle: 'Collection', icone: 'collection' },
];

/**
 * Coquille de l'application : un bandeau (logo, et au bureau la navigation), la page, qui fournit son propre
 * `<main>`, et sur téléphone la navigation en barre d'onglets fixée en bas (US-060).
 */
@Component({
  selector: 'hip-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icone],
  templateUrl: './app.html',
})
export class App {
  protected readonly compte = inject(CompteService);
  protected readonly duels = inject(MesDuelsService);
  protected readonly stock = inject(StockBoostersService);
  protected readonly onglets = ONGLETS;

  private readonly router = inject(Router);
  private readonly injecteur = inject(Injector);
  private readonly url = signal(this.router.url);
  protected readonly enPartie = computed(() => EN_PARTIE.test(this.url()));

  constructor() {
    // Vérifie la session gardée par le navigateur, sans retarder l'affichage.
    void this.compte.charger();
    // Le stock de boosters de l'onglet « Boosters », lu à la connexion (US-060).
    effect(() => {
      if (this.compte.joueur()) void this.stock.charger();
    });
    // « À vous de jouer » se met à jour à chaque changement de page (US-035), et une session que le serveur n'a pas
    // pu vérifier est revérifiée (US-055).
    let pagePrecedente: Route | null | undefined;
    const navigation = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((fin) => {
        this.url.set(fin.urlAfterRedirects);
        void this.duels.charger();
        if (this.compte.echec()) void this.compte.charger();
        // Nouvelle page (pas une fenêtre de détail ouverte sur la même) : son titre prend le focus (US-060).
        const page = this.router.routerState.snapshot.root.firstChild?.routeConfig;
        if (pagePrecedente !== undefined && page !== pagePrecedente) this.focaliserTitre();
        pagePrecedente = page ?? null;
      });
    inject(DestroyRef).onDestroy(() => navigation.unsubscribe());
  }

  /** Le lecteur d'écran annonce la nouvelle page : le focus va à son titre `h1`, à défaut à son `<main>`. */
  private focaliserTitre(): void {
    afterNextRender(
      () => {
        const document = globalThis.document;
        const cible =
          document?.querySelector<HTMLElement>('main h1') ?? document?.querySelector('main');
        if (!cible) return;
        if (!cible.hasAttribute('tabindex')) cible.setAttribute('tabindex', '-1');
        cible.focus();
      },
      { injector: this.injecteur },
    );
  }
}
