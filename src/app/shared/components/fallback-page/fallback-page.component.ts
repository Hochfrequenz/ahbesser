import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-fallback-page',
  standalone: true,
  templateUrl: './fallback-page.component.html',
  styleUrls: ['./fallback-page.component.css']
})
export class FallbackPageComponent {
  @Input() pruefi!: string;
  @Input() formatVersion!: string;
}
