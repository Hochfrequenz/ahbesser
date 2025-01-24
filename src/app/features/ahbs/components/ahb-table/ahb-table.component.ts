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
import { HighlightPipe } from '../../../../shared/pipes/highlight.pipe';
import { environment } from '../../../../environments/environment';

interface ExpandedState {
  [key: number]: boolean;
}

@Component({
  selector: 'app-ahb-table',
  standalone: true,
  imports: [HighlightPipe],
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

  private highlightSignal = computed(() => this.highlight());
  markIndex = signal(0);
  expandedRows = signal<ExpandedState>({});

  // max. string length of 'Bedingung/Hinweis' entries
  readonly COLLAPSE_LENGTH = 80;

  markElements = computed<HTMLElement[]>(() => {
    const highlight = this.highlight();
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
      const selectedMarkElement = this.selectedMarkElement();
      if (selectedMarkElement === null) {
        return;
      }
      // make selected element orange
      const markElements = this.markElements();
      markElements.forEach(el => el.classList.remove('bg-orange-500'));
      selectedMarkElement.classList.add('bg-orange-500');
      // notify outer scroll container
      this.scrollToHighlightedElement();
    });
  }

  resetMarkIndex() {
    this.markIndex.set(0);
    this.scrollToHighlightedElement();
  }

  getHighlight(): string | undefined {
    return this.highlightSignal();
  }

  nextResult() {
    const markElements = this.markElements();
    if (markElements.length > 0) {
      const nextIndex = (this.markIndex() + 1) % markElements.length;
      this.markIndex.set(nextIndex);
      this.scrollToHighlightedElement();
    }
  }

  previousResult() {
    const markElements = this.markElements();
    if (markElements.length > 0) {
      const previousIndex = (this.markIndex() - 1 + markElements.length) % markElements.length;
      this.markIndex.set(previousIndex);
      this.scrollToHighlightedElement();
    }
  }

  scrollToHighlightedElement() {
    const selectedElement = this.selectedMarkElement();
    const header = this.header();
    const headerHeight = header?.nativeElement.getBoundingClientRect().height ?? 0;
    this.selectElement.emit({
      element: selectedElement || this.elementRef.nativeElement,
      offsetY: headerHeight,
    });
  }

  // determines each time the section_name changes to add a bold rule in ahb-table.component.html
  hasSectionNameChanged(currentIndex: number): boolean {
    if (currentIndex === 0) return false;
    const currentLine = this.lines()[currentIndex];
    const previousLine = this.lines()[currentIndex - 1];
    return currentLine.section_name !== previousLine.section_name;
  }

  // determines each time the section changes
  hasSegmentChanged(currentIndex: number): boolean {
    if (currentIndex === 0) return false;
    const currentLine = this.lines()[currentIndex];
    const previousLine = this.lines()[currentIndex - 1];
    return currentLine.segment_code !== previousLine.segment_code;
  }

  // determines each time the data_element changes to add a dashed rule in ahb-table.component.html
  hasDataElementChanged(currentIndex: number): boolean {
    if (currentIndex === 0) return false;
    const currentLine = this.lines()[currentIndex];
    const previousLine = this.lines()[currentIndex - 1];
    return (
      currentLine.data_element !== previousLine.data_element && currentLine.data_element !== ''
    );
  }

  // determines the appropriate class for each row
  getRowClass(index: number): string {
    if (index === 0) return '';

    if (this.hasSectionNameChanged(index)) {
      return 'border-t-2 border-gray-300'; // bold line between different segment_names
    }

    if (this.hasDataElementChanged(index) || this.hasSegmentChanged(index)) {
      return 'border-t border-gray-300'; // thin solid line between different data_elements
    }

    return 'border-t border-gray-250 border-dashed'; //  by default: dashed line between all rows (if not overwritten by the bold/thin solid lines)
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

  // split before [<condition>] and remove empty strings
  addConditionLineBreaks(conditions: string): string[] {
    if (!conditions) return [];
    return conditions
      .split(/(?=\[\d+\])/)
      .map(s => s.trim())
      .filter(s => s);
  }

  toggleExpand(index: number) {
    const currentState = this.expandedRows();
    this.expandedRows.set({
      ...currentState,
      [index]: !currentState[index],
    });
  }

  isExpanded(index: number): boolean {
    return this.expandedRows()[index] || false;
  }

  // "mehr/weniger anzeigen" toggle for 'Bedingungen/Hinweise' column if len > COLLAPSE_LENGTH
  shouldShowToggle(conditions: string): boolean {
    if (!conditions) return false;
    const allConditions = this.addConditionLineBreaks(conditions);
    return allConditions.length > 1;
  }

  getDisplayText(conditions: string, rowIndex: number): string {
    if (!conditions) return '';
    const allConditions = this.addConditionLineBreaks(conditions);

    if (this.isExpanded(rowIndex)) {
      return conditions;
    }

    return allConditions[0];
  }
}
