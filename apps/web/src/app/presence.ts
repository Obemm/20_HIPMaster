import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { ReseauService } from './reseau/reseau';

/** Sans geste pendant ce délai, le joueur est considéré absent (US-055). */
export const INACTIVITE_MS = 10 * 60_000;
/** Ce qui montre que le joueur est là : toucher, cliquer, bouger la souris, taper, faire défiler. */
const GESTES = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll'] as const;

function ongletVisible(): boolean {
  return globalThis.document?.visibilityState !== 'hidden';
}

/**
 * Le joueur est-il là ? Oui tant que l'onglet est visible et qu'il a fait un geste depuis moins de 10 minutes. En son
 * absence, les interrogations périodiques s'arrêtent : un onglet oublié ne doit pas réveiller la base gratuite toutes
 * les minutes, jour et nuit (ADR 0021).
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly visible = signal(ongletVisible());
  private readonly actif = signal(true);
  readonly present = computed(() => this.visible() && this.actif());

  private dernierGeste = Date.now();
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const surGeste = () => this.geste();
    const surVisibilite = () => {
      this.visible.set(ongletVisible());
      // Revenir sur l'onglet est un geste.
      if (ongletVisible()) this.geste();
    };
    for (const geste of GESTES) {
      globalThis.addEventListener?.(geste, surGeste, { capture: true, passive: true });
    }
    globalThis.document?.addEventListener('visibilitychange', surVisibilite);
    this.surveiller();
    inject(DestroyRef).onDestroy(() => {
      for (const geste of GESTES) {
        globalThis.removeEventListener?.(geste, surGeste, { capture: true });
      }
      globalThis.document?.removeEventListener('visibilitychange', surVisibilite);
      clearTimeout(this.minuterie);
    });
  }

  private geste(): void {
    this.dernierGeste = Date.now();
    if (!this.actif()) {
      this.actif.set(true);
      this.surveiller();
    }
  }

  /** À l'échéance du dernier geste : absent s'il n'y en a pas eu d'autre depuis, sinon rendez-vous à la suivante. */
  private surveiller(): void {
    clearTimeout(this.minuterie);
    const reste = this.dernierGeste + INACTIVITE_MS - Date.now();
    if (reste > 0) this.minuterie = setTimeout(() => this.surveiller(), reste);
    else this.actif.set(false);
  }
}

/**
 * Lance `action` toutes les `periodeMs` tant que le joueur est là et que `condition` tient (US-055). L'interrogation
 * s'arrête en son absence et reprend à son retour, aussitôt si la période est écoulée. Elle attend aussi la fin d'une
 * pause demandée par le serveur (429). Chaque passage part après la fin du précédent : jamais deux à la fois.
 *
 * À appeler dans un contexte d'injection : l'interrogation s'arrête avec lui. Le premier passage vient une période
 * après l'appel, le premier chargement restant à la charge de l'appelant.
 */
export function interroger(
  action: () => Promise<void> | void,
  periodeMs: number,
  condition: () => boolean = () => true,
): void {
  const presence = inject(PresenceService);
  const reseau = inject(ReseauService);
  const actif = computed(() => presence.present() && condition());
  let dernierPassage = Date.now();

  effect((onCleanup) => {
    if (!actif()) return;
    let arrete = false;
    let minuterie: ReturnType<typeof setTimeout> | undefined;

    function planifier(delai: number): void {
      minuterie = setTimeout(() => void passer(), delai);
    }
    async function passer(): Promise<void> {
      const pause = reseau.pause();
      if (pause > 0) {
        planifier(pause);
        return;
      }
      dernierPassage = Date.now();
      try {
        await action();
      } finally {
        if (!arrete) planifier(periodeMs);
      }
    }

    planifier(Math.max(0, dernierPassage + periodeMs - Date.now()));
    onCleanup(() => {
      arrete = true;
      clearTimeout(minuterie);
    });
  });
}
