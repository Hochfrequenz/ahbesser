import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
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
  header = viewChild<ElementRef>('header');

  lines = input.required<Ahb['lines']>();
  highlight = input<string | undefined>();

  selectElement = output<{ element: HTMLElement; offsetY: number }>();

  markIndex = signal(0);

  markElements = computed<HTMLElement[]>(() => {
    const highlight = this.highlight();
    const nativeElement = this.elementRef.nativeElement;
    if (!highlight || !nativeElement) {
      return [];
    }
    return nativeElement.querySelectorAll('mark');
  });

  selectedMarkElement = computed(() => {
    const markIndex = this.markIndex();
    const markElements = this.markElements();
    if (markElements.length === 0 || markElements.length < markIndex + 1) {
      return null;
    }
    return markElements[this.markIndex()];
  });

  constructor(private readonly elementRef: ElementRef) {
    // reset index on highlight change
    effect(
      () => {
        this.highlight();
        this.markIndex.set(0);
      },
      {
        allowSignalWrites: true,
      },
    );
    effect(() => {
      const selectedMarkElement = this.selectedMarkElement();
      if (selectedMarkElement === null) {
        return;
      }
      // make selected element orange
      const markElements = this.markElements();
      markElements.forEach((el) => el.classList.remove('bg-orange-500'));
      selectedMarkElement.classList.add('bg-orange-500');
      // notify outer scroll container
      const header = this.header();
      const headerHeight =
        header?.nativeElement.getBoundingClientRect().height ?? 0;
      this.selectElement.emit({
        element: selectedMarkElement,
        offsetY: headerHeight,
      });
    });
  }

  nextResult() {
    const markIndex = this.markIndex() + 1;
    const markElements = this.markElements();
    if (markIndex < markElements.length) {
      this.markIndex.set(markIndex);
      return;
    }
    this.markIndex.set(0);
  }

  previousResult() {
    const markIndex = this.markIndex() - 1;
    if (markIndex >= 0) {
      this.markIndex.set(markIndex);
      return;
    }
    this.markIndex.set(this.markElements().length - 1);
  }
}
