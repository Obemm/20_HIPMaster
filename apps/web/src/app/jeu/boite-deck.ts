import { Component, computed, inject, input } from '@angular/core';
import type { Carte } from '../cartes/carte';
import { ILLUSTRATIONS_CARTES, sourcesIllustration } from '../cartes/illustrations';
import type { Rarete } from '../libelles';
import type { Deck } from './modele';

const ORDRE_RARETE: Record<Rarete, number> = { legendaire: 3, epique: 2, rare: 1, commune: 0 };

/**
 * Les trois cartes phares d'un deck : les plus rares, puis les plus chères. Sans le catalogue, les trois premières
 * cartes distinctes du deck.
 */
export function cartesPhares(
  deck: Deck,
  catalogue: readonly Carte[] | undefined,
): (Carte | number)[] {
  const numeros = [...new Set(deck.cartes)];
  if (!catalogue) return numeros.slice(0, 3);
  const parNumero = new Map(catalogue.map((c) => [c.numero, c]));
  return numeros
    .flatMap((n) => parNumero.get(n) ?? [])
    .sort((a, b) => ORDRE_RARETE[b.rarete] - ORDRE_RARETE[a.rarete] || b.cout - a.cout)
    .slice(0, 3);
}

/**
 * Un deck prêté présenté comme une boîte de jeu (US-068) : ses trois cartes phares en éventail, son nom et sa
 * description. Le bouton qui le choisit (« Jouer avec… », « Défier avec… ») est fourni par l'écran.
 */
@Component({
  selector: 'hip-boite-deck',
  template: `
    <div class="flex items-center gap-3">
      <div class="mini-eventail" aria-hidden="true">
        @for (phare of phares(); track phare.numero) {
          <div [class]="'cadre-' + phare.rarete">
            @if (phare.illustree) {
              <picture>
                <source type="image/avif" [attr.srcset]="phare.sources.avif" sizes="5rem" />
                <source type="image/webp" [attr.srcset]="phare.sources.webp" sizes="5rem" />
                <img
                  [src]="phare.sources.defaut"
                  alt=""
                  width="320"
                  height="240"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            }
          </div>
        }
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        @if (niveauTitre() === 2) {
          <h2 class="text-xl font-extrabold">{{ deck().nom }}</h2>
        } @else {
          <h3 class="text-xl font-extrabold">{{ deck().nom }}</h3>
        }
        <p class="text-sm text-texte-doux">{{ deck().description }}</p>
      </div>
    </div>
    <ng-content />
  `,
  host: { class: 'panneau flex flex-col gap-3 p-4' },
})
export class BoiteDeck {
  readonly deck = input.required<Deck>();
  /** Le catalogue, pour choisir les cartes phares ; sans lui, les premières cartes du deck. */
  readonly catalogue = input<readonly Carte[]>();
  /** Niveau du titre du deck dans la page (2 sous le `h1`, 3 sous un `h2`). */
  readonly niveauTitre = input<2 | 3>(2);

  private readonly illustrations = inject(ILLUSTRATIONS_CARTES);
  protected readonly phares = computed(() =>
    cartesPhares(this.deck(), this.catalogue()).map((carte) => {
      const numero = typeof carte === 'number' ? carte : carte.numero;
      return {
        numero,
        rarete: typeof carte === 'number' ? 'commune' : carte.rarete,
        illustree: this.illustrations[numero] !== undefined,
        sources: sourcesIllustration(numero),
      };
    }),
  );
}
