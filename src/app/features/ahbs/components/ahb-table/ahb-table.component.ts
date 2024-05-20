import { Component, input } from '@angular/core';
import { Ahb } from '../../../../core/api';
import { JsonPipe } from '@angular/common';
import { HighlightPipe } from '../../../../shared/pipes/highlight.pipe';

@Component({
  selector: 'app-ahb-table',
  standalone: true,
  imports: [JsonPipe, HighlightPipe],
  templateUrl: './ahb-table.component.html',
  styleUrl: './ahb-table.component.scss',
})
export class AhbTableComponent {
  lines = input.required<Ahb['lines']>();
  highlight = input<string | undefined>();
}
