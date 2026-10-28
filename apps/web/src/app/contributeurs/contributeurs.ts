import { httpResource } from '@angular/common/http';
import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { contributeurs } from '../cartes/communaute';
import { VignetteCarte } from '../cartes/vignette-carte';
import { ErreurChargement } from '../reseau/erreur-chargement';

/** Le guide pour proposer une carte (ADR 0050), en anglais comme tout le dépôt (ADR 0051). */
export const GUIDE_CONTRIBUTEUR = 'https://github.com/Obemm/20_HIPMaster/blob/main/CONTRIBUTING.md';

/**
 * Page « Contributeurs » (US-031) : les personnes qui ont proposé des cartes, chacune avec ses cartes publiées. Tirée
 * du catalogue, déjà en cache (ADR 0039) ; le détail d'une carte s'ouvre par-dessus, comme dans le catalogue.
 */
@Component({
  selector: 'hip-contributeurs',
  imports: [RouterOutlet, VignetteCarte, ErreurChargement],
  templateUrl: './contributeurs.html',
})
export class ContributeursEcran {
  protected readonly guide = GUIDE_CONTRIBUTEUR;
  protected readonly cartes = httpResource<Carte[]>(() => '/api/v1/cartes');
  protected readonly contributeurs = computed(() =>
    this.cartes.hasValue() ? contributeurs(this.cartes.value()) : [],
  );
}
