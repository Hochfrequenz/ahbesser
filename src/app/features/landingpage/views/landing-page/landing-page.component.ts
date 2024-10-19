import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { LoginButtonComponent } from '../../../../shared/components/login-button/login-button.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, LoginButtonComponent, RouterLink],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {}
