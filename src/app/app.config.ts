import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter,withDebugTracing  } from '@angular/router';
import { provideHttpClient, withInterceptors , withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Lara from '@primeng/themes/lara';
import { AuthInterceptor } from './auth.interceptor';
import { Auth } from './services/auth/auth';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([AuthInterceptor])
    ),
    // On load, try a silent refresh so a valid httpOnly refresh cookie restores
    // the in-memory access token (survives page reloads). Failure is fine — the
    // user just isn't logged in. Skipped for external-auditor sessions.
    provideAppInitializer(() => {
      const auth = inject(Auth);
      if (typeof window !== 'undefined' && localStorage.getItem('userType') === 'EXTERNAL') return;
      return firstValueFrom(auth.refresh().pipe(catchError(() => of(null))));
    }),
    provideAnimations(),
    MessageService,
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    })
  ]
};
