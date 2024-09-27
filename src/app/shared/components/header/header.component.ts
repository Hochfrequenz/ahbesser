import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconLogoComponent } from '../icon-logo/icon-logo.component';
import { PruefiNavigationComponent } from '../../../features/ahbs/components/pruefi-navigation/pruefi-navigation.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, IconLogoComponent, PruefiNavigationComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {}
