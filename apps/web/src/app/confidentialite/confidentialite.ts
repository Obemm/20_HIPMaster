import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Une durée de conservation ; `aVenir` : annoncée, mais pas encore appliquée (purge d'US-054). */
export interface Conservation {
  donnees: string;
  duree: string;
  aVenir?: true;
}

/**
 * Durées de conservation (US-053, ADR 0031). Celles marquées `aVenir` sont proposées et seront appliquées par la purge
 * d'US-054 : la page le dit, pour ne rien promettre qui ne soit pas encore vrai.
 */
export const CONSERVATIONS: readonly Conservation[] = [
  { donnees: 'Votre compte et vos données de jeu', duree: 'jusqu’à ce que vous le supprimiez' },
  { donnees: 'Un compte resté inutilisé', duree: '12 mois, puis suppression', aVenir: true },
  {
    donnees: 'Une session (un appareil connecté)',
    duree: '90 jours sans utilisation',
    aVenir: true,
  },
  { donnees: 'Une partie contre le bot', duree: '24 heures sans coup joué' },
  { donnees: 'Les journaux techniques (adresses IP comprises)', duree: '30 jours au plus' },
  { donnees: 'Les sauvegardes de la base', duree: '30 jours au plus' },
  { donnees: 'Les compteurs anti-abus (adresse IP)', duree: 'une heure au plus, en mémoire' },
];

/** Page « À propos et confidentialité » (US-053) : qui édite le jeu, ce qu'il garde, pourquoi, combien de temps. */
@Component({
  selector: 'hip-confidentialite',
  imports: [RouterLink],
  templateUrl: './confidentialite.html',
})
export class ConfidentialiteEcran {
  protected readonly conservations = CONSERVATIONS;
  protected readonly aVenir = CONSERVATIONS.some((c) => c.aVenir);
}
