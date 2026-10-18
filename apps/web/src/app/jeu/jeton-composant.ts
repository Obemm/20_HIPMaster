import { Component, computed, input } from '@angular/core';
import type { Carte } from '../cartes/carte';
import { Icone } from '../icone';
import type { Composant } from './modele';

/**
 * Un composant posé sur le plateau, en format compact : cadre de rareté, nom, attaque et PV du moment. Purement
 * visuel : c'est le bouton qui l'entoure qui porte l'interaction et le nom accessible.
 */
@Component({
  selector: 'hip-jeton-composant',
  imports: [Icone],
  template: `
    @let c = carte();
    <div
      class="halo-carte flex h-full flex-col gap-1 rounded-lg border-2 border-cadre bg-fond-carte p-1.5 text-left text-texte"
      [class]="'cadre-' + c.rarete"
      aria-hidden="true"
    >
      <p class="flex items-start gap-1 text-xs leading-tight font-semibold">
        <hip-icone [nom]="c.famille" class="size-3.5 text-texte-doux" />
        <span class="line-clamp-2">{{ c.nom }}</span>
      </p>
      @if (capacites()) {
        <p class="truncate text-[10px] text-texte-doux" [class.line-through]="sansCapacites()">
          {{ capacites() }}
        </p>
      }
      @for (statut of statuts(); track statut) {
        <p class="text-[10px] leading-tight font-semibold text-alerte">{{ statut }}</p>
      }
      <p class="mt-auto flex items-center justify-between text-sm font-bold">
        <span class="flex items-center gap-0.5">
          <hip-icone nom="attaque" class="size-3.5 text-red-600 dark:text-red-400" />{{
            composant().attaque
          }}
        </span>
        <span class="flex items-center gap-0.5" [class.text-alerte]="blesse()">
          <hip-icone nom="pv" class="size-3.5 text-blue-600 dark:text-blue-400" />{{
            composant().pv
          }}
        </span>
      </p>
    </div>
  `,
  host: { class: 'block h-full' },
})
export class JetonComposant {
  readonly composant = input.required<Composant>();
  readonly carte = input.required<Carte>();

  protected readonly capacites = computed(() =>
    this.carte()
      .capacites.map((c) => c.nom)
      .join(' · '),
  );
  protected readonly statuts = computed(() => statutsComposant(this.composant()));
  protected readonly sansCapacites = computed(
    () => (this.composant().sansCapacitesJusquAuTour ?? null) !== null,
  );
  protected readonly blesse = computed(() => {
    const carte = this.carte();
    return carte.pv !== undefined && this.composant().pv < carte.pv;
  });
}

/** Les statuts visibles d'un composant (sorts et incidents), en toutes lettres. */
export function statutsComposant(composant: Composant): string[] {
  const statuts: string[] = [];
  if ((composant.immobiliseJusquAuTour ?? null) !== null) statuts.push('Immobilisé');
  if ((composant.sansCapacitesJusquAuTour ?? null) !== null) statuts.push('Sans capacités');
  if (composant.doublon) statuts.push('Doublon');
  if (composant.attaqueNulle) statuts.push('Attaque nulle');
  if (composant.coupleA) statuts.push('Couplé');
  return statuts;
}

/** Nom accessible d'un composant : tout ce que le jeton montre, en toutes lettres. */
export function decrireComposant(composant: Composant, carte: Carte): string {
  const parties = [carte.nom, `attaque ${composant.attaque}`, `PV ${composant.pv}`];
  parties.push(...carte.capacites.map((c) => c.nom), ...statutsComposant(composant));
  return parties.join(', ');
}
