import { Component } from '@angular/core';
import { IconLogoComponent } from '../icon-logo/icon-logo.component';
import { IconHeartComponent } from '../icon-heart/icon-heart.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [IconHeartComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
