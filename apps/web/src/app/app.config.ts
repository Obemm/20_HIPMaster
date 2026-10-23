import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { intercepteurJeton } from './compte/compte.service';
import { RapporteurErreurs } from './erreurs/rapporteur-erreurs';
import { intercepteurReseau } from './reseau/reseau';
import { TitreAvecDuels } from './titre';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Les erreurs non gérées partent aussi vers Error Reporting, par l'API (US-051).
    { provide: ErrorHandler, useClass: RapporteurErreurs },
    provideRouter(routes, withComponentInputBinding()),
    // Le jeton d'abord (et le 401), puis les nouvelles tentatives des lectures en panne passagère (US-055).
    provideHttpClient(withFetch(), withInterceptors([intercepteurJeton, intercepteurReseau])),
    // Le titre de l'onglet compte les duels qui attendent le joueur (US-035).
    { provide: TitleStrategy, useClass: TitreAvecDuels },
  ],
};
