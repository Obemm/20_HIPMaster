import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { intercepteurJeton } from './compte/compte.service';
import { TitreAvecDuels } from './titre';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([intercepteurJeton])),
    // Le titre de l'onglet compte les duels qui attendent le joueur (US-035).
    { provide: TitleStrategy, useClass: TitreAvecDuels },
  ],
};
