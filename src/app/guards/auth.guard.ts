import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private isDevelopment =
    !environment.isProduction || window.location.hostname === 'localhost';

  constructor(private auth: AuthService) {}

  canActivate(
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    if (this.isDevelopment) {
      return of(true);
    }

    return this.auth.isAuthenticated$.pipe(
      tap((loggedIn) => {
        if (!loggedIn) {
          this.auth.loginWithRedirect({
            appState: { target: state.url },
          });
        }
      }),
    );
  }
}
