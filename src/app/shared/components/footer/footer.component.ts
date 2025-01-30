import { Component } from '@angular/core';
import { VersionDisplayComponent } from '../version-display/version-display.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [VersionDisplayComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
