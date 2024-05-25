import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconLogoComponent } from '../icon-logo/icon-logo.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, IconLogoComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {}
