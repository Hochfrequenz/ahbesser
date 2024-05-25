import { Component, effect, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconMagnifyingGlassComponent } from '../icon-magnifying-glass/icon-magnifying-glass.component';
import { IconArrowLeftComponent } from '../icon-arrow-left/icon-arrow-left.component';
import { IconArrowRightComponent } from '../icon-arrow-right/icon-arrow-right.component';

@Component({
  selector: 'app-input-search-enhanced',
  standalone: true,
  imports: [
    FormsModule,
    IconMagnifyingGlassComponent,
    IconArrowLeftComponent,
    IconArrowRightComponent,
  ],
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
