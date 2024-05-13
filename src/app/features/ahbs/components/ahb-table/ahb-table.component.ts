import { Component, Input } from '@angular/core';
import { Ahb } from '../../../../core/api';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-ahb-table',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './ahb-table.component.html',
  styleUrl: './ahb-table.component.scss',
})
export class AhbTableComponent {
  @Input({ required: true }) lines!: Ahb['lines'];
}
