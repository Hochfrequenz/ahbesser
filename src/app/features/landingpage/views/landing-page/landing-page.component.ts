import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { LoginButtonComponent } from '../../../../shared/components/login-button/login-button.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, LoginButtonComponent],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  onOpenClick() {
    if (!environment.production || window.location.hostname === 'localhost') {
      this.router.navigate(['/ahb']);
      return;
    }

    this.auth.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigate(['/ahb']);
      } else {
        this.auth.loginWithRedirect({
          appState: { target: '/ahb' },
        });
      }
    });
  }
}
