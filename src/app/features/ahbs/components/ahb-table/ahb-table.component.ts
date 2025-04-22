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
import { IconLinkComponent } from '../../../../shared/components/icon-link/icon-link.component';

interface ExpandedState {
  [key: number]: boolean;
}

@Component({
  selector: 'app-ahb-table',
  standalone: true,
  imports: [HighlightPipe, IconLinkComponent],
  templateUrl: './ahb-table.component.html',
  styleUrl: './ahb-table.component.scss',
})
export class AhbTableComponent {
  header = viewChild<ElementRef>('header');

  lines = input.required<Ahb['lines']>();
  highlight = input<string | undefined>();
  formatVersion = input.required<string>();
  pruefi = input.required<string>();

  scrollToElement = output<{ element: HTMLElement; offsetY: number }>();

  private highlightSignal = computed(() => this.highlight());
  markIndex = signal(0);
  expandedRows = signal<ExpandedState>({});

  // max. string length of 'Bedingung/Hinweis' entries
  readonly COLLAPSE_LENGTH = 80;

  private readonly LINE_TYPE = {
    SEGMENT_GROUP: 'segment_group',
    SEGMENT: 'segment',
    CODE: 'code',
    DATA_ELEMENT: 'dataelement',
  } as const;

  private readonly LINE_STYLE = {
    THICK: 'border-t-4 border-hf-grell-rose',
    THIN: 'border-t-2 border-hf-grell-rose',
    THIN_DOTTED: 'border-t-2 border-hf-grell-rose border-dashed',
    GREEN: 'border-t-4 border-green-500',
    NONE: '',
  } as const;

  markElements = computed<HTMLElement[]>(() => {
    const highlight = this.highlight();
    const nativeElement = this.elementRef.nativeElement;
    if (!highlight || !nativeElement) {
      return [];
    }
    return Array.from(nativeElement.querySelectorAll('mark'));
  });

  constructor(private readonly elementRef: ElementRef) {
    // Watch for highlight changes to reset the index
    effect(() => {
      const highlight = this.highlight();
      if (highlight) {
        this.markIndex.set(0);
        setTimeout(() => this.applyCurrentMark());
      }
    });
  }

  resetMarkIndex() {
    this.markIndex.set(0);
    this.applyCurrentMark();
  }

  getHighlight(): string | undefined {
    return this.highlightSignal();
  }

  nextResult() {
    const markElements = this.markElements();
    if (markElements.length === 0) return;

    const nextIndex = (this.markIndex() + 1) % markElements.length;
    this.markIndex.set(nextIndex);
    this.applyCurrentMark();
  }

  previousResult() {
    const markElements = this.markElements();
    if (markElements.length === 0) return;

    const previousIndex = (this.markIndex() - 1 + markElements.length) % markElements.length;
    this.markIndex.set(previousIndex);
    this.applyCurrentMark();
  }

  private applyCurrentMark() {
    const markElements = this.markElements();
    const currentIndex = this.markIndex();

    if (markElements.length === 0 || currentIndex >= markElements.length) {
      return;
    }

    // Update highlighting
    markElements.forEach(el => el.classList.remove('bg-orange-500'));
    const currentElement = markElements[currentIndex];
    currentElement.classList.add('bg-orange-500');

    // Notify parent component to scroll to this element
    if (currentElement) {
      const headerHeight = this.header()?.nativeElement.getBoundingClientRect().height ?? 0;
      this.scrollToElement.emit({
        element: currentElement,
        offsetY: headerHeight + 20,
      });
    }
  }

  // determines each time the section_name changes to add a bold rule in ahb-table.component.html
  hasSectionNameChanged(currentIndex: number): boolean {
    if (currentIndex === 0) return false;
    const currentLine = this.lines()[currentIndex];
    const previousLine = this.lines()[currentIndex - 1];
    return currentLine.section_name !== previousLine.section_name;
  }

  private getLineStyle(currentLine: Ahb['lines'][0], previousLine: Ahb['lines'][0]): string {
    if (!previousLine) return this.LINE_STYLE.NONE;

    const currentType = currentLine.line_type;
    const previousType = previousLine.line_type;

    // Change from segment_group to segment: thick line
    if (previousType === this.LINE_TYPE.SEGMENT_GROUP && currentType === this.LINE_TYPE.SEGMENT) {
      return this.LINE_STYLE.THICK;
    }

    // Change from segment to data_element: thin line
    if (previousType === this.LINE_TYPE.SEGMENT && currentType === this.LINE_TYPE.DATA_ELEMENT) {
      return this.LINE_STYLE.THIN;
    }

    // Change from segment to code: thin line
    if (previousType === this.LINE_TYPE.SEGMENT && currentType === this.LINE_TYPE.CODE) {
      return this.LINE_STYLE.THIN;
    }

    // Change from code to code (same segment_code and data_element): thin dotted line
    if (
      previousType === this.LINE_TYPE.CODE &&
      currentType === this.LINE_TYPE.CODE &&
      previousLine.segment_code === currentLine.segment_code &&
      previousLine.data_element === currentLine.data_element
    ) {
      return this.LINE_STYLE.THIN_DOTTED;
    }

    // Change from code to code: thin line
    if (previousType === this.LINE_TYPE.CODE && currentType === this.LINE_TYPE.CODE) {
      return this.LINE_STYLE.THIN;
    }

    // Change from code to data_element: thin line
    if (previousType === this.LINE_TYPE.CODE && currentType === this.LINE_TYPE.DATA_ELEMENT) {
      return this.LINE_STYLE.THIN;
    }

    // Change from code to segment_group: thick line
    if (previousType === this.LINE_TYPE.CODE && currentType === this.LINE_TYPE.SEGMENT_GROUP) {
      return this.LINE_STYLE.THICK;
    }

    // Change from code to segment: thick line
    if (previousType === this.LINE_TYPE.CODE && currentType === this.LINE_TYPE.SEGMENT) {
      return this.LINE_STYLE.THICK;
    }

    // Change from data_element to segment_group: thick line
    if (
      previousType === this.LINE_TYPE.DATA_ELEMENT &&
      currentType === this.LINE_TYPE.SEGMENT_GROUP
    ) {
      return this.LINE_STYLE.THICK;
    }

    // Change from data_element to segment: thick line
    if (previousType === this.LINE_TYPE.DATA_ELEMENT && currentType === this.LINE_TYPE.SEGMENT) {
      return this.LINE_STYLE.THICK;
    }

    // Change from data_element to data_element (same segment_code and data_element): thin dotted line
    if (
      previousType === this.LINE_TYPE.DATA_ELEMENT &&
      currentType === this.LINE_TYPE.DATA_ELEMENT &&
      previousLine.segment_code === currentLine.segment_code &&
      previousLine.data_element === currentLine.data_element
    ) {
      return this.LINE_STYLE.THIN_DOTTED;
    }

    // Change from data_element to code: thin line
    if (previousType === this.LINE_TYPE.DATA_ELEMENT && currentType === this.LINE_TYPE.CODE) {
      return this.LINE_STYLE.THIN;
    }

    return this.LINE_STYLE.NONE;
  }

  // determines the appropriate class for each row
  getRowClass(index: number): string {
    if (index === 0) return this.LINE_STYLE.NONE;

    const currentLine = this.lines()[index];
    const previousLine = this.lines()[index - 1];

    return this.getLineStyle(currentLine, previousLine);
  }

  isSegmentGroup(index: number): boolean {
    const currentLine = this.lines()[index];

    if (currentLine.line_type === this.LINE_TYPE.SEGMENT_GROUP) {
      return true;
    }

    return false;
  }

  generateBedingungsbaumDeepLink(expression: string): string {
    const encodedExpression = encodeURIComponent(expression);
    return `${environment.bedingungsbaumBaseUrl}/tree/?format=${this.getFormat(this.pruefi())}&format_version=${this.formatVersion()}&expression=${encodedExpression}`;
  }

  generateEbdDeepLink(value_pool_entry: string | null): string | null {
    if (!value_pool_entry || value_pool_entry.trim().length === 0) {
      return null;
    }
    const regex = /^.*\b(?<ebd_key>E_\d+)\b.*$/;
    const match = value_pool_entry.match(regex);
    if (!match?.groups) {
      return null;
    }
    const ebdKey = match.groups['ebd_key']!;
    // e.g. https://ebd.stage.hochfrequenz.de/ebd/?formatversion=FV2504&ebd=E_0004
    return `${environment.ebdBaseUrl}/ebd/?format_version=${this.formatVersion()}&ebd=${ebdKey}`;
  }

  private getFormat(pruefi: string): string {
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
