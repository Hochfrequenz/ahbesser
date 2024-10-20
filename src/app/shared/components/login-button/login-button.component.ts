import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-login-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-button.component.html',
})
export class LoginButtonComponent implements OnInit {
  authState$!: Observable<{ isAuthenticated: boolean; isLoading: boolean }>;
  buttonText$ = new BehaviorSubject<string>('Einloggen');

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.authState$ = combineLatest([
      this.auth.isAuthenticated$,
      this.auth.isLoading$,
    ]).pipe(
      map(([isAuthenticated, isLoading]) => ({ isAuthenticated, isLoading })),
      tap(({ isAuthenticated, isLoading }) => {
        if (!isLoading) {
          this.buttonText$.next(isAuthenticated ? 'Ausloggen' : 'Einloggen');
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
