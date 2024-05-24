import { Component, effect, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-search-enhanced',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './input-search-enhanced.component.html',
})
export class InputSearchEnhancedComponent {
  selectedPosition = input<number | undefined>();
  totalResults = input<number | undefined>();

  searchQueryChange = output<string | undefined>();
  keyupEnter = output();
  nextClick = output();
  previousClick = output();

  searchQuery = model<string>();

  constructor() {
    effect(() => {
      this.searchQueryChange.emit(this.searchQuery());
    });
  }
}
