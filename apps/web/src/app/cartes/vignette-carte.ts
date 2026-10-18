import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../icone';
import { LIBELLES_RARETE, SYMBOLES_RARETE } from '../libelles';
import { type Carte, ILLUSTRATIONS_FAMILLE, LIBELLES_FAMILLE, libelleType } from './carte';

/**
 * Une carte au format portrait, façon carte à jouer (US-009). Les tailles sont relatives à la largeur de la carte
 * (unités `cqw`) : le même composant sert en vignette dans une grille et en grand dans le détail.
 */
@Component({
  selector: 'hip-vignette-carte',
  imports: [RouterLink, Icone],
  templateUrl: './vignette-carte.html',
  host: { class: 'block @container' },
})
export class VignetteCarte {
  readonly carte = input.required<Carte>();
  /** Lien vers le détail : toute la carte devient cliquable. Sans lien, la carte est purement visuelle. */
  readonly lien = input<string[]>();

  protected readonly libelleRarete = computed(
    () => `${SYMBOLES_RARETE[this.carte().rarete]} ${LIBELLES_RARETE[this.carte().rarete]}`,
  );
  protected readonly sousTitre = computed(
    () => `${libelleType(this.carte())} · ${LIBELLES_FAMILLE[this.carte().famille]}`,
  );
  protected readonly illustration = computed(() => ILLUSTRATIONS_FAMILLE[this.carte().famille]);
  /** Le texte court de la carte : son effet, sinon le nom de ses capacités. */
  protected readonly texte = computed(
    () =>
      this.carte().effet ??
      this.carte()
        .capacites.map((c) => c.nom)
        .join(' · '),
  );
}
