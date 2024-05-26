import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon-logo',
  standalone: true,
  templateUrl: './icon-logo.component.html',
})
export class IconLogoComponent {
  size = input(46);
}
