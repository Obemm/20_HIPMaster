import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';
import { Catalogue } from './cartes/catalogue';
import { DetailCarte } from './cartes/detail-carte';

export const routes: Routes = [
  { path: '', component: Accueil, title: 'HIPMaster' },
  {
    path: 'cartes',
    component: Catalogue,
    title: 'Catalogue des cartes — HIPMaster',
    // Le détail s'affiche en fenêtre modale par-dessus le catalogue, qui reste en place avec ses filtres.
    children: [{ path: ':numero', component: DetailCarte, title: 'Carte — HIPMaster' }],
  },
  { path: '**', redirectTo: '' },
];
