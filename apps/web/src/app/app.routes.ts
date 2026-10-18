import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';
import { Catalogue } from './cartes/catalogue';
import { CompteEcran } from './compte/compte';
import { DetailCarte } from './cartes/detail-carte';
import { ChoixDeck } from './jeu/choix-deck';
import { PartieEcran } from './jeu/partie';

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
  { path: 'jouer/:id', component: PartieEcran, title: 'Partie — HIPMaster' },
  { path: 'compte', component: CompteEcran, title: 'Mon compte — HIPMaster' },
  { path: '**', redirectTo: '' },
];
