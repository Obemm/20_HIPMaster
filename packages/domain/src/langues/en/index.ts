import type { TextesLangue } from '../textes.ts';
import { CAPACITES_EN } from './capacites.ts';
import { TEXTES_CARTES_EN } from './cartes.ts';
import { DECKS_EN } from './decks.ts';
import { FICHES_API_EN } from './fiches/api.ts';
import { FICHES_BESTIAIRE_EN } from './fiches/bestiaire.ts';
import { FICHES_EDA_EN } from './fiches/eda.ts';
import { FICHES_ESB_EN } from './fiches/esb.ts';
import { FICHES_FICHIERS_EN } from './fiches/fichiers.ts';
import { FICHES_IA_EN } from './fiches/ia.ts';
import { FICHES_IPAAS_EN } from './fiches/ipaas.ts';
import { FICHES_PATTERNS_EN } from './fiches/patterns.ts';
import { NIVEAUX_EN } from './niveaux.ts';

/** Le catalogue en anglais (US-081) : une traduction du français, relue par le porteur du projet. */
export const TEXTES_EN: TextesLangue = {
  cartes: TEXTES_CARTES_EN,
  capacites: CAPACITES_EN,
  fiches: {
    ...FICHES_FICHIERS_EN,
    ...FICHES_ESB_EN,
    ...FICHES_API_EN,
    ...FICHES_IPAAS_EN,
    ...FICHES_EDA_EN,
    ...FICHES_IA_EN,
    ...FICHES_PATTERNS_EN,
    ...FICHES_BESTIAIRE_EN,
  },
  niveaux: NIVEAUX_EN,
  decks: DECKS_EN,
};
