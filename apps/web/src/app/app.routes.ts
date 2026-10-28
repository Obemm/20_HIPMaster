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
    title: $localize`Catalogue des cartes — HIPMaster`,
    // Le détail s'affiche en fenêtre modale par-dessus le catalogue, qui reste en place avec ses filtres.
    children: [
      { path: ':numero', loadComponent: detailCarte, title: $localize`Carte — HIPMaster` },
    ],
  },
  {
    path: 'jouer',
    loadComponent: () => import('./jeu/choix-deck').then((m) => m.ChoixDeck),
    title: $localize`Jouer contre le bot — HIPMaster`,
  },
  {
    path: 'jouer/:id',
    loadComponent: () => import('./jeu/partie').then((m) => m.PartieEcran),
    title: $localize`Partie — HIPMaster`,
  },
  {
    path: 'boosters',
    loadComponent: () => import('./boosters/boosters').then((m) => m.BoostersEcran),
    title: $localize`Mes boosters — HIPMaster`,
  },
  {
    path: 'collection',
    loadComponent: () => import('./collection/collection').then((m) => m.CollectionEcran),
    title: $localize`Ma collection — HIPMaster`,
    children: [
      {
        path: ':numero',
        loadComponent: detailCarte,
        title: $localize`Carte — HIPMaster`,
        data: { retour: '/collection' },
      },
    ],
  },
  // Mes decks (US-083) : la liste, puis l'écran de construction d'un nouveau deck ou d'un deck existant.
  {
    path: 'decks',
    loadComponent: () => import('./decks/mes-decks').then((m) => m.MesDecksEcran),
    title: $localize`Mes decks — HIPMaster`,
  },
  // `nouveau` pour un deck à créer : une seule route, pour que l'écran reste en place quand il passe à l'adresse du
  // deck qu'il vient d'enregistrer.
  {
    path: 'decks/:id',
    loadComponent: () => import('./decks/construction-deck').then((m) => m.ConstructionDeck),
    title: $localize`Construire un deck — HIPMaster`,
  },
  {
    path: 'duels',
    loadComponent: () => import('./duels/mes-duels').then((m) => m.MesDuels),
    title: $localize`Mes duels — HIPMaster`,
  },
  {
    path: 'duels/hasard',
    loadComponent: () => import('./duels/nouveau-defi').then((m) => m.NouveauDefi),
    title: $localize`Adversaire au hasard — HIPMaster`,
    data: { hasard: true },
  },
  {
    path: 'duels/nouveau',
    loadComponent: () => import('./duels/nouveau-defi').then((m) => m.NouveauDefi),
    title: $localize`Défier un collègue — HIPMaster`,
  },
  {
    path: 'duels/:id',
    loadComponent: () => import('./duels/duel').then((m) => m.DuelEcran),
    title: $localize`Duel — HIPMaster`,
  },
  {
    path: 'classement',
    loadComponent: () => import('./classement/classement').then((m) => m.ClassementEcran),
    title: $localize`Classement — HIPMaster`,
  },
  {
    path: 'compte',
    loadComponent: () => import('./compte/compte').then((m) => m.CompteEcran),
    title: $localize`Mon compte — HIPMaster`,
  },
  // Les contributeurs et leurs cartes (US-031) ; le détail d'une carte s'ouvre par-dessus, comme dans le catalogue.
  {
    path: 'contributeurs',
    loadComponent: () => import('./contributeurs/contributeurs').then((m) => m.ContributeursEcran),
    title: $localize`Contributeurs — HIPMaster`,
    children: [
      {
        path: ':numero',
        loadComponent: detailCarte,
        title: $localize`Carte — HIPMaster`,
        data: { retour: '/contributeurs' },
      },
    ],
  },
  {
    path: 'confidentialite',
    loadComponent: () =>
      import('./confidentialite/confidentialite').then((m) => m.ConfidentialiteEcran),
    title: $localize`À propos et confidentialité — HIPMaster`,
  },
  // Réservée aux administrateurs (US-072) : pour tout autre joueur, retour à l'accueil.
  {
    path: 'inviter',
    loadComponent: () => import('./administration/inviter').then((m) => m.InviterEcran),
    title: $localize`Inviter — HIPMaster`,
  },
  // Réservée aux administrateurs, comme « Inviter » (US-070, ADR 0045).
  {
    path: 'offrir',
    loadComponent: () => import('./administration/offrir').then((m) => m.OffrirEcran),
    title: $localize`Offrir des boosters — HIPMaster`,
  },
  { path: '**', redirectTo: '' },
];
