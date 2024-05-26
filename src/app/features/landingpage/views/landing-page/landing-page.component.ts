import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [HeaderComponent, RouterLink, FooterComponent],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {}
