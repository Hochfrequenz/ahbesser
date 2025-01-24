import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconHeartComponent } from '../icon-heart/icon-heart.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, IconHeartComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
