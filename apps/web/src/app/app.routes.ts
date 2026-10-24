import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';
import { BoostersEcran } from './boosters/boosters';
import { CollectionEcran } from './collection/collection';
import { MesDuels } from './duels/mes-duels';
import { NouveauDefi } from './duels/nouveau-defi';
import { Catalogue } from './cartes/catalogue';
import { CompteEcran } from './compte/compte';
import { ConfidentialiteEcran } from './confidentialite/confidentialite';
import { DetailCarte } from './cartes/detail-carte';
import { ChoixDeck } from './jeu/choix-deck';

export const routes: Routes = [
  { path: '', component: Accueil, title: 'HIPMaster' },
  {
    path: 'cartes',
    component: Catalogue,
    title: 'Catalogue des cartes — HIPMaster',
    // Le détail s'affiche en fenêtre modale par-dessus le catalogue, qui reste en place avec ses filtres.
    children: [{ path: ':numero', component: DetailCarte, title: 'Carte — HIPMaster' }],
  },
  { path: 'jouer', component: ChoixDeck, title: 'Jouer contre le bot — HIPMaster' },
  // Le plateau (partie et duel) est chargé à la demande : l'accueil s'affiche plus vite (US-061).
  {
    path: 'jouer/:id',
    loadComponent: () => import('./jeu/partie').then((m) => m.PartieEcran),
    title: 'Partie — HIPMaster',
  },
  { path: 'boosters', component: BoostersEcran, title: 'Mes boosters — HIPMaster' },
  {
    path: 'collection',
    component: CollectionEcran,
    title: 'Ma collection — HIPMaster',
    children: [
      {
        path: ':numero',
        component: DetailCarte,
        title: 'Carte — HIPMaster',
        data: { retour: '/collection' },
      },
    ],
  },
  { path: 'duels', component: MesDuels, title: 'Mes duels — HIPMaster' },
  {
    path: 'duels/hasard',
    component: NouveauDefi,
    title: 'Adversaire au hasard — HIPMaster',
    data: { hasard: true },
  },
  { path: 'duels/nouveau', component: NouveauDefi, title: 'Défier un collègue — HIPMaster' },
  {
    path: 'duels/:id',
    loadComponent: () => import('./duels/duel').then((m) => m.DuelEcran),
    title: 'Duel — HIPMaster',
  },
  { path: 'compte', component: CompteEcran, title: 'Mon compte — HIPMaster' },
  {
    path: 'confidentialite',
    component: ConfidentialiteEcran,
    title: 'À propos et confidentialité — HIPMaster',
  },
  // Réservée aux administrateurs (US-072) : pour tout autre joueur, retour à l'accueil.
  {
    path: 'inviter',
    loadComponent: () => import('./administration/inviter').then((m) => m.InviterEcran),
    title: 'Inviter — HIPMaster',
  },
  { path: '**', redirectTo: '' },
];
