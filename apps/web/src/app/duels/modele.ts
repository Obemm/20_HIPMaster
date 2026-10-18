import type { Evenement, Vue } from '../jeu/modele';

// Forme des duels renvoyés par l'API (contrat : apps/api/openapi/duels.yaml, US-032).
export interface Duel {
  id: string;
  statut: 'attente' | 'en-cours' | 'termine';
  version: number;
  createur: { pseudo: string };
  deckCreateur: string;
  adversaire: { pseudo: string } | null;
  /** Le camp du joueur connecté ; `null` s'il ne participe pas (il voit un défi à relever). */
  moi: 'j1' | 'j2' | null;
  curseur: number;
  vue: Vue | null;
  evenements: Evenement[];
}
