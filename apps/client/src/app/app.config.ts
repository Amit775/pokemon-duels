import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BOARD_CONFIG } from '@pokemon-duel/board';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: BOARD_CONFIG,
      useValue: { signalRUrl: environment.signalRUrl },
    },
  ],
};
