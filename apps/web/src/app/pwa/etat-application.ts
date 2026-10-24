import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';

/**
 * Les deux bandeaux du jeu installé (US-063, ADR 0038), en haut de l'écran, sur la coquille de nuit :
 * - « Pas de réseau » : l'interface vient du cache, mais le jeu se joue en ligne (le serveur fait foi, ADR 0004) ;
 * - « Nouvelle version prête » : la mise à jour est téléchargée, « Recharger » la lance, au lieu de garder
 *   indéfiniment l'ancienne. Le service worker en cherche une à chaque retour sur l'onglet.
 */
@Component({
  selector: 'hip-etat-application',
  template: `
    @if (horsLigne()) {
      <p role="status" class="bandeau-etat">
        <span
          ><strong>Pas de réseau.</strong> HIPMaster se joue en ligne : vos cartes et vos parties
          sont gardées par le serveur. Reconnectez-vous pour continuer.</span
        >
      </p>
    }
    @if (nouvelleVersion()) {
      <div role="status" class="bandeau-etat">
        <p>Une nouvelle version de HIPMaster est prête.</p>
        <button type="button" class="bouton bouton-jeu bouton-petit shrink-0" (click)="recharger()">
          Recharger
        </button>
      </div>
    }
  `,
  host: { class: 'coquille fixed inset-x-0 top-0 z-40 flex flex-col' },
})
export class EtatApplication {
  private readonly document = inject(DOCUMENT);
  private readonly fenetre = this.document.defaultView;
  private readonly miseAJour = inject(SwUpdate, { optional: true });

  protected readonly horsLigne = signal(this.fenetre?.navigator.onLine === false);
  protected readonly nouvelleVersion = signal(false);

  constructor() {
    const suivreReseau = () => this.horsLigne.set(this.fenetre?.navigator.onLine === false);
    const verifierVersion = () => {
      if (this.document.visibilityState === 'visible' && this.miseAJour?.isEnabled) {
        void this.miseAJour.checkForUpdate().catch(() => undefined);
      }
    };
    this.fenetre?.addEventListener('online', suivreReseau);
    this.fenetre?.addEventListener('offline', suivreReseau);
    this.document.addEventListener('visibilitychange', verifierVersion);

    const abonnement = this.miseAJour?.isEnabled
      ? this.miseAJour.versionUpdates.subscribe((evenement: VersionEvent) => {
          if (evenement.type === 'VERSION_READY') this.nouvelleVersion.set(true);
        })
      : undefined;

    inject(DestroyRef).onDestroy(() => {
      this.fenetre?.removeEventListener('online', suivreReseau);
      this.fenetre?.removeEventListener('offline', suivreReseau);
      this.document.removeEventListener('visibilitychange', verifierVersion);
      abonnement?.unsubscribe();
    });
  }

  protected recharger(): void {
    this.document.location.reload();
  }
}
