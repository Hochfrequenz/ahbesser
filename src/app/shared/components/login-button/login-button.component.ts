import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

type ExtendedAuthService = AuthService & {
  user$: Observable<User>;
};

@Component({
  selector: 'app-login-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-button.component.html',
})
export class LoginButtonComponent implements OnInit {
  authState$!: Observable<{ isAuthenticated: boolean; isLoading: boolean }>;
  buttonText$ = new BehaviorSubject<string>('Einloggen');

  private isDevelopment =
    !environment.isProduction || window.location.hostname === 'localhost';

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.authState$ = combineLatest([
      this.isDevelopment ? of(true) : this.auth.isAuthenticated$,
      this.isDevelopment ? of(false) : this.auth.isLoading$,
    ]).pipe(
      map(([isAuthenticated, isLoading]) => ({ isAuthenticated, isLoading })),
      tap(({ isAuthenticated, isLoading }) => {
        if (!isLoading) {
          this.buttonText$.next(isAuthenticated ? 'Ausloggen' : 'Einloggen');
        }
      }),
      tap(({ isAuthenticated }) => {
        if (this.isDevelopment && isAuthenticated) {
          (this.auth as ExtendedAuthService).user$ = of({
            email: 'local@development.com',
            name: 'Local Development User',
            sub: 'local-development',
          } as User);
        }
      }),
    );
  }

  loginOrLogout() {
    this.auth.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.logout();
      } else {
        this.login();
      }
    });
  }

  private login() {
    this.auth.loginWithRedirect();
  }

  private logout() {
    this.auth.logout({ logoutParams: { returnTo: document.location.origin } });
  }
}
