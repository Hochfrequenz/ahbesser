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
import { environment } from '../../../../environments/environment';

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
  formatVersion = input.required<string>();
  pruefi = input.required<string>();

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
      currentLine.data_element !== ''
    );
  }

  // determines the appropriate class for each row
  getRowClass(index: number): string {
    if (index === 0) return '';

    if (this.hasSectionNameChanged(index)) {
      return 'border-t-2 border-gray-300'; // bold line between different segment_names
    }

    if (this.hasDataElementChanged(index)) {
      return 'border-t border-gray-400 border-dashed'; // dashed line between different data_elements
    }

    return 'border-t border-gray-300'; // thin solid horizontal line between all rows (if not overwritten by the bold/dashed lines)
  }

  isNewSegment(index: number): boolean {
    return this.hasSectionNameChanged(index);
  }

  generateBedingungsbaumDeepLink(expression: string): string {
    const encodedExpression = encodeURIComponent(expression);
    return `${environment.bedingungsbaumBaseUrl}/tree/?format=${this.formatVersion()}&format_version=${this.getFormatVersion(this.pruefi())}&expression=${encodedExpression}`;
  }

  private getFormatVersion(pruefi: string): string {
    const mapping: { [key: string]: string } = {
      '99': 'APERAK',
      '29': 'COMDIS',
      '21': 'IFTSTA',
      '23': 'INSRPT',
      '31': 'INVOIC',
      '13': 'MSCONS',
      '39': 'ORDCHG',
      '17': 'ORDERS',
      '19': 'ORDRSP',
      '27': 'PRICAT',
      '15': 'QUOTES',
      '33': 'REMADV',
      '35': 'REQOTE',
      '37': 'PARTIN',
      '11': 'UTILMD',
      '25': 'UTILTS',
      '91': 'CONTRL',
      '92': 'APERAK',
      '44': 'UTILMD',
      '55': 'UTILMD',
    };

    const key = pruefi.substring(0, 2);
    return mapping[key] || '';
  }

  addConditionLineBreaks(conditions: string): string[] {
    return conditions ? conditions.split('\n') : [];
  }
}
