import {
  Component,
  computed,
  ElementRef,
  effect,
  input,
  signal,
  viewChild,
  OnInit,
} from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { ActivatedRoute } from '@angular/router';
import { AhbTableComponent } from '../../components/ahb-table/ahb-table.component';
import { Ahb, AhbService } from '../../../../core/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { AhbSearchFormHeaderComponent } from '../../components/ahb-search-form-header/ahb-search-form-header.component';
import { InputSearchEnhancedComponent } from '../../../../shared/components/input-search-enhanced/input-search-enhanced.component';
import { HighlightPipe } from '../../../../shared/pipes/highlight.pipe';
import { scrollToElement } from '../../../../core/helper/scroll-to-element';
import { ExportButtonComponent } from '../../components/export-button/export-button.component';
import { IconCopyUrlComponent } from '../../../../shared/components/icon-copy-url/icon-copy-url.component';

@Component({
  selector: 'app-ahb-page',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent,
    AhbTableComponent,
    CommonModule,
    AhbSearchFormHeaderComponent,
    InputSearchEnhancedComponent,
    HighlightPipe,
    ExportButtonComponent,
    IconCopyUrlComponent,
  ],
  templateUrl: './ahb-page.component.html',
})
export class AhbPageComponent implements OnInit {
  formatVersion = input.required<string>();
  pruefi = input.required<string>();

  table = viewChild(AhbTableComponent);
  scroll = viewChild<ElementRef>('scroll');

  searchQuery = signal<string | undefined>('');
  edifactFormat = computed(() => this.getEdifactFormat(this.pruefi()));

  ahb$?: Observable<Ahb>;
  lines$?: Observable<Ahb['lines']>;

  private initialSearchQuery: string | null = null;

  constructor(
    private readonly ahbService: AhbService,
    private readonly route: ActivatedRoute,
  ) {
    effect(() => {
      this.loadAhbData();
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const query = params['query'];
      if (query) {
        this.initialSearchQuery = query;
        this.searchQuery.set(query);
      }
    });
  }

  private loadAhbData() {
    this.ahb$ = this.ahbService
      .getAhb$Json({
        'format-version': this.formatVersion(),
        pruefi: this.pruefi(),
      })
      .pipe(
        tap(() => {
          if (this.initialSearchQuery) {
            setTimeout(() => this.triggerSearch(this.initialSearchQuery!), 0);
          }
        }),
        shareReplay(1),
      );

    this.lines$ = this.ahb$.pipe(map((ahb) => ahb.lines));
  }

  triggerSearch(query: string | undefined) {
    if (!query) return;

    const tableComponent = this.table();
    if (tableComponent) {
      tableComponent.resetMarkIndex();
      tableComponent.nextResult();
    }
    this.initialSearchQuery = null; // Reset after first use
  }

  onSearchQueryChange(query: string | undefined) {
    this.searchQuery.set(query);
    this.triggerSearch(query);
  }

  onNextClick() {
    const tableComponent = this.table();
    if (tableComponent) {
      tableComponent.nextResult();
    }
  }

  onPreviousClick() {
    const tableComponent = this.table();
    if (tableComponent) {
      tableComponent.previousResult();
    }
  }

  // mapping provided by mig_ahb_utility_stack
  private getEdifactFormat(pruefi: string): string {
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
      '44': 'UTILMD Gas', // UTILMD for GAS since FV2310
      '55': 'UTILMD Strom', // UTILMD for STROM since FV2310
    };

    const key = pruefi.substring(0, 2);
    return mapping[key];
  }

  // splitting meta.direction into sender and empfaenger
  getSenderEmpfaenger(direction: string | null): {
    sender: string;
    empfaenger: string;
  } {
    if (!direction) {
      return {
        sender:
          'MSCONS-Nachrichten können von verschiedenen Marktrollen gesendet werden.',
        empfaenger:
          'MSCONS-Nachrichten können von verschiedenen Marktrollen empfangen werden.',
      };
    }

    const [sender, empfaenger] = direction
      .split(' an ')
      .map((part) => part.trim());
    return { sender, empfaenger: empfaenger || '' };
  }

  scrollToElement(element: HTMLElement, offsetY: number): void {
    const scrollContainer = this.scroll();
    if (!scrollContainer?.nativeElement) {
      return;
    }
    scrollToElement(element, offsetY, scrollContainer.nativeElement);
  }
}
