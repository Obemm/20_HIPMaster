import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';
import { Catalogue } from './cartes/catalogue';
import { DetailCarte } from './cartes/detail-carte';

export const routes: Routes = [
  { path: '', component: Accueil, title: 'HIPMaster' },
  { path: 'cartes', component: Catalogue, title: 'Catalogue des cartes — HIPMaster' },
  { path: 'cartes/:numero', component: DetailCarte, title: 'Carte — HIPMaster' },
  { path: '**', redirectTo: '' },
];
