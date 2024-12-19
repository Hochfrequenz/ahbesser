import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconLogoComponent } from '../icon-logo/icon-logo.component';
import { LoginButtonComponent } from '../login-button/login-button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, IconLogoComponent, LoginButtonComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {}
