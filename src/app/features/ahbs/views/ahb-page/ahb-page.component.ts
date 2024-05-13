import { Component, Input } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-ahb-page',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './ahb-page.component.html',
})
export class AhbPageComponent {
  @Input() formatVersion?: string;
  @Input() pruefi?: string;
}
