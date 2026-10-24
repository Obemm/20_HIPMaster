import { Injectable, signal } from '@angular/core';

const CLE_AIDE_VUE = 'hipmaster.aide-vue';
const CLE_COUPS_DE_POUCE = 'hipmaster.coups-de-pouce';
const CLE_CONSEIL_CHAQUE_COUP = 'hipmaster.conseil-chaque-coup';
const CLE_GUIDE_FINI = 'hipmaster.partie-guidee-finie';

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

  /** Les coups de pouce avant de finir son tour (US-065) : actifs, sauf si le joueur les a désactivés. */
  readonly coupsDePouce = signal(lire(CLE_COUPS_DE_POUCE) !== 'non');

  activerCoupsDePouce(actifs: boolean): void {
    this.coupsDePouce.set(actifs);
    ecrire(CLE_COUPS_DE_POUCE, actifs ? 'oui' : 'non');
  }

  /** Contre le bot, le conseil s'affiche à chaque coup sans le demander (US-066) : désactivé, sauf choix du joueur. */
  readonly conseilAChaqueCoup = signal(lire(CLE_CONSEIL_CHAQUE_COUP) === 'oui');

  activerConseilAChaqueCoup(actif: boolean): void {
    this.conseilAChaqueCoup.set(actif);
    ecrire(CLE_CONSEIL_CHAQUE_COUP, actif ? 'oui' : 'non');
  }

  /** La partie guidée a été suivie jusqu'au bout ou passée (US-067) : elle n'est plus proposée en premier. */
  readonly guideFini = signal(lire(CLE_GUIDE_FINI) === 'oui');

  marquerGuideFini(): void {
    this.guideFini.set(true);
    ecrire(CLE_GUIDE_FINI, 'oui');
  }
}
