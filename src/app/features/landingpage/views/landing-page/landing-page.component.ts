import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {}
