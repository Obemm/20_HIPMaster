import { Component, inject } from '@angular/core';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { CompteService } from './compte.service';

/**
 * Ce qu'affiche un écran réservé aux comptes tant que la session gardée par le navigateur n'est pas vérifiée
 * (US-055) : la vérification en cours, ou pourquoi elle a échoué, avec « Réessayer ». Jamais « Créer un compte » : le
 * compte existe, et il reste gardé.
 */
@Component({
  selector: 'hip-etat-session',
  imports: [ErreurChargement],
  template: `
    @if (compte.echec(); as echec) {
      <hip-erreur-chargement
        quoi="Votre session n’a pas pu être vérifiée, mais votre compte reste gardé par ce navigateur."
        [erreur]="echec"
        [enCours]="compte.enVerification()"
        (reessayer)="compte.reessayer()"
      />
    } @else {
      <p>Vérification de votre session…</p>
    }
  `,
})
export class EtatSession {
  protected readonly compte = inject(CompteService);
}
