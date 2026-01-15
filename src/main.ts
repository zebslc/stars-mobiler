import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { logInternalError, normalizeError } from './app/services/core/internal-logger.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(appRoutes),
    provideHttpClient()
  ]
}).catch((err: unknown) => {
  logInternalError('bootstrapApplication failed', { error: normalizeError(err) }, 'AngularBootstrap');
});
