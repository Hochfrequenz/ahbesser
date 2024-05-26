import { Component } from '@angular/core';
import { IconLogoComponent } from '../icon-logo/icon-logo.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [IconLogoComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent {}
