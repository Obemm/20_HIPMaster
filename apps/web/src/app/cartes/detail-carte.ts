import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  type OnDestroy,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icone } from '../icone';
import { LIBELLES_RARETE, SYMBOLES_RARETE } from '../libelles';
import { type Carte, LIBELLES_FAMILLE, libelleType } from './carte';
import { VignetteCarte } from './vignette-carte';

/**
 * Détail d'une carte en fenêtre modale (`<dialog>` natif : focus piégé, touche Échap), au-dessus du catalogue.
 * L'URL `/cartes/:numero` reste partageable ; fermer revient au catalogue et rend le focus à la carte choisie.
 */
@Component({
  selector: 'hip-detail-carte',
  imports: [RouterLink, Icone, VignetteCarte],
  templateUrl: './detail-carte.html',
})
export class DetailCarte implements OnDestroy {
  /** Paramètre de route `:numero`, lié par `withComponentInputBinding()`. */
  readonly numero = input.required<string>();

  private readonly router = inject(Router);
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');
  /** L'élément qui avait le focus avant l'ouverture (la carte choisie), pour le lui rendre. */
  private readonly focusPrecedent = inject(DOCUMENT).activeElement as HTMLElement | null;

  protected readonly libellesFamille = LIBELLES_FAMILLE;
  protected readonly libellesRarete = LIBELLES_RARETE;
  protected readonly symbolesRarete = SYMBOLES_RARETE;
  protected readonly libelleType = libelleType;

  protected readonly carte = httpResource<Carte>(
    () => `/api/v1/cartes/${encodeURIComponent(this.numero())}`,
  );

  /** La carte d'origine d'une évolution, pour afficher son nom. */
  protected readonly origine = httpResource<Carte>(() => {
    const origine = this.carte.hasValue() ? this.carte.value().origine : undefined;
    return origine === undefined ? undefined : `/api/v1/cartes/${origine}`;
  });

  protected readonly introuvable = computed(() => {
    const erreur = this.carte.error();
    return erreur instanceof HttpErrorResponse && [400, 404].includes(erreur.status);
  });

  constructor() {
    afterNextRender(() => {
      const dialogue = this.dialogue().nativeElement;
      // Clic sur le fond : équivalent souris de la touche Échap (gérée par l'événement `cancel`).
      dialogue.addEventListener('click', (evenement) => this.clicFond(evenement));
      // jsdom (tests unitaires) ne connaît pas showModal.
      if (typeof dialogue.showModal === 'function') dialogue.showModal();
      else dialogue.setAttribute('open', '');
    });
  }

  protected fermer(): void {
    void this.router.navigate(['/cartes']);
  }

  /** Touche Échap : on passe par le routeur plutôt que de laisser le navigateur fermer seul la fenêtre. */
  protected annuler(evenement: Event): void {
    evenement.preventDefault();
    this.fermer();
  }

  /** Un clic sur le fond (hors du contenu) a pour cible le `<dialog>` lui-même. */
  private clicFond(evenement: MouseEvent): void {
    if (evenement.target === this.dialogue().nativeElement) this.fermer();
  }

  ngOnDestroy(): void {
    const dialogue = this.dialogue().nativeElement;
    if (typeof dialogue.close === 'function') dialogue.close();
    if (this.focusPrecedent?.isConnected) this.focusPrecedent.focus();
  }
}
