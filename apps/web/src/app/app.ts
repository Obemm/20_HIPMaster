import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Coquille de l'application : chaque page fournit son propre `<main>`. */
@Component({
  selector: 'hip-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
