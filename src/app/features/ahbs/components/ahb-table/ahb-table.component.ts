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

  private highlightSignal = signal<string | undefined>(undefined);
  markIndex = signal(0);

  markElements = computed<HTMLElement[]>(() => {
    const highlight = this.getHighlight();
    const nativeElement = this.elementRef.nativeElement;
    if (!highlight || !nativeElement) {
      return [];
    }
    return Array.from(nativeElement.querySelectorAll('mark'));
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
    effect(() => {
      this.highlightSignal.set(this.highlight());
      this.markIndex.set(0);
    });

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

  setHighlight(value: string | undefined) {
    this.highlightSignal.set(value);
    this.markIndex.set(0);
  }

  getHighlight(): string | undefined {
    return this.highlightSignal();
  }

  nextResult() {
    const markElements = this.markElements();
    if (markElements.length > 0) {
      const nextIndex = (this.markIndex() + 1) % markElements.length;
      this.markIndex.set(nextIndex);
    }
  }

  previousResult() {
    const markElements = this.markElements();
    if (markElements.length > 0) {
      const previousIndex =
        (this.markIndex() - 1 + markElements.length) % markElements.length;
      this.markIndex.set(previousIndex);
    }
  }

  // determines each time the section_name changes to add a bold rule in ahb-table.component.html
  hasSectionNameChanged(currentIndex: number): boolean {
    if (currentIndex === 0) return false;
    const currentLine = this.lines()[currentIndex];
    const previousLine = this.lines()[currentIndex - 1];
    return currentLine.section_name !== previousLine.section_name;
  }

  // determines each time the data_element changes to add a dashed rule in ahb-table.component.html
  hasDataElementChanged(currentIndex: number): boolean {
    if (currentIndex === 0) return false;
    const currentLine = this.lines()[currentIndex];
    const previousLine = this.lines()[currentIndex - 1];
    return (
      currentLine.data_element !== previousLine.data_element &&
      currentLine.data_element !== '' &&
      !this.hasSectionNameChanged(currentIndex)
    );
  }

  // determines the appropriate class for each row
  getRowClass(index: number): string {
    const classes: string[] = [];

    if (this.hasSectionNameChanged(index)) {
      classes.push('border-t-2 border-gray-300');
    } else if (this.hasDataElementChanged(index)) {
      classes.push('border-t border-gray-400 border-dashed');
    } else {
      classes.push('border-b');
    }

    return classes.join(' ');
  }

  isNewSegment(index: number): boolean {
    return this.hasSectionNameChanged(index);
  }
}
