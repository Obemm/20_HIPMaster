import { httpResource } from '@angular/common/http';
import { Component, computed, input, linkedSignal } from '@angular/core';
import { Icone } from '../icone';
import { ErreurChargement } from '../reseau/erreur-chargement';
import type { CarteDetaillee, LienExterne } from './carte';

let suivant = 0;

/**
 * Le bouton « En savoir plus » et la fiche qu'il déplie (US-073, ADR 0036) : la profondeur à la demande, sous le
 * texte court de la carte. Les liens externes s'ouvrent dans un nouvel onglet, sans transmettre la page d'origine.
 */
@Component({
  selector: 'hip-en-savoir-plus',
  imports: [Icone, ErreurChargement],
  templateUrl: './en-savoir-plus.html',
})
export class EnSavoirPlus {
  /** La carte ; sa fiche est lue telle quelle, sauf si `charger` demande d'aller la chercher. */
  readonly carte = input.required<CarteDetaillee>();
  /**
   * Lire la fiche à l'ouverture (`GET /cartes/{numero}`) : en partie, les cartes viennent de la liste du catalogue,
   * qui ne la porte pas. Sans `charger`, une carte sans fiche n'affiche pas de bouton.
   */
  readonly charger = input(false);

  protected readonly id = `fiche-${++suivant}`;
  /** Repliée par défaut, et de nouveau repliée quand on choisit une autre carte. */
  protected readonly ouverte = linkedSignal({
    source: () => this.carte().numero,
    computation: () => false,
  });
  /** La fiche n'est demandée qu'à la première ouverture, puis gardée tant qu'on reste sur la même carte. */
  private readonly demandee = linkedSignal({
    source: () => this.carte().numero,
    computation: () => false,
  });

  protected readonly detail = httpResource<CarteDetaillee>(() =>
    this.charger() && this.demandee() ? `/api/v1/cartes/${this.carte().numero}` : undefined,
  );

  protected readonly fiche = computed(() => {
    if (!this.charger()) return this.carte().fiche;
    return this.detail.hasValue() ? this.detail.value().fiche : undefined;
  });
  protected readonly visible = computed(() => this.charger() || this.carte().fiche !== undefined);
  /** Vrai jusqu'à la réponse, y compris pendant un nouvel essai après une erreur. */
  protected readonly chargement = computed(
    () => this.charger() && (this.detail.isLoading() || !this.detail.hasValue()),
  );
  protected readonly erreur = computed(() => (this.charger() ? this.detail.error() : undefined));
  /** Un incident ne « sert » à rien : sa fiche dit plutôt comment il survient. */
  protected readonly titreUsage = computed(() =>
    this.carte().type === 'incident' ? 'Comment ça arrive ?' : 'À quoi ça sert ?',
  );

  protected basculer(): void {
    this.ouverte.update((ouverte) => !ouverte);
    this.demandee.set(true);
  }

  protected recharger(): void {
    this.detail.reload();
  }

  protected site(lien: LienExterne): string {
    return new URL(lien.url).hostname.replace(/^www\./, '');
  }
}
