import { Injectable, signal } from '@angular/core';

const CLE_AIDE_VUE = 'hipmaster.aide-vue';

/** Lecture du stockage du navigateur ; un stockage refusé (navigation privée stricte) vaut « rien de retenu ». */
function lire(cle: string): string | null {
  try {
    return globalThis.localStorage?.getItem(cle) ?? null;
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string): void {
  try {
    globalThis.localStorage?.setItem(cle, valeur);
  } catch {
    // Stockage refusé ou plein : la préférence vaut pour cette visite seulement.
  }
}

/**
 * Les préférences d'interface, gardées par le navigateur et jamais envoyées à l'API (ADR 0032). Rien de ce que le
 * serveur décide n'est ici.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  /** L'aide « Comment jouer ? » s'est déjà ouverte d'elle-même (US-059) : elle ne le fait qu'une fois. */
  readonly aideVue = signal(lire(CLE_AIDE_VUE) === 'oui');

  marquerAideVue(): void {
    this.aideVue.set(true);
    ecrire(CLE_AIDE_VUE, 'oui');
  }
}
