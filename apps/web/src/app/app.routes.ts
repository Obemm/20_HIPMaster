import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';

/** Le détail d'une carte, en fenêtre modale par-dessus le catalogue ou la collection. */
const detailCarte = () => import('./cartes/detail-carte').then((m) => m.DetailCarte);

// Seul l'accueil est dans le bundle initial : chaque autre page est chargée à la demande, à sa première ouverture
// (US-061 pour le plateau, US-057 pour les autres).
export const routes: Routes = [
  { path: '', component: Accueil, title: 'HIPMaster' },
  {
    path: 'cartes',
    loadComponent: () => import('./cartes/catalogue').then((m) => m.Catalogue),
    title: 'Catalogue des cartes — HIPMaster',
    // Le détail s'affiche en fenêtre modale par-dessus le catalogue, qui reste en place avec ses filtres.
    children: [{ path: ':numero', loadComponent: detailCarte, title: 'Carte — HIPMaster' }],
  },
  {
    path: 'jouer',
    loadComponent: () => import('./jeu/choix-deck').then((m) => m.ChoixDeck),
    title: 'Jouer contre le bot — HIPMaster',
  },
  {
    path: 'jouer/:id',
    loadComponent: () => import('./jeu/partie').then((m) => m.PartieEcran),
    title: 'Partie — HIPMaster',
  },
  {
    path: 'boosters',
    loadComponent: () => import('./boosters/boosters').then((m) => m.BoostersEcran),
    title: 'Mes boosters — HIPMaster',
  },
  {
    path: 'collection',
    loadComponent: () => import('./collection/collection').then((m) => m.CollectionEcran),
    title: 'Ma collection — HIPMaster',
    children: [
      {
        path: ':numero',
        loadComponent: detailCarte,
        title: 'Carte — HIPMaster',
        data: { retour: '/collection' },
      },
    ],
  },
  {
    path: 'duels',
    loadComponent: () => import('./duels/mes-duels').then((m) => m.MesDuels),
    title: 'Mes duels — HIPMaster',
  },
  {
    path: 'duels/hasard',
    loadComponent: () => import('./duels/nouveau-defi').then((m) => m.NouveauDefi),
    title: 'Adversaire au hasard — HIPMaster',
    data: { hasard: true },
  },
  {
    path: 'duels/nouveau',
    loadComponent: () => import('./duels/nouveau-defi').then((m) => m.NouveauDefi),
    title: 'Défier un collègue — HIPMaster',
  },
  {
    path: 'duels/:id',
    loadComponent: () => import('./duels/duel').then((m) => m.DuelEcran),
    title: 'Duel — HIPMaster',
  },
  {
    path: 'compte',
    loadComponent: () => import('./compte/compte').then((m) => m.CompteEcran),
    title: 'Mon compte — HIPMaster',
  },
  {
    path: 'confidentialite',
    loadComponent: () =>
      import('./confidentialite/confidentialite').then((m) => m.ConfidentialiteEcran),
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
