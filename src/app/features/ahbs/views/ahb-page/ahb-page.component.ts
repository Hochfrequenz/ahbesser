import {
  Component,
  ElementRef,
  viewChild,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SolutionsFooterComponent } from '../../../../shared/components/solutions-footer/solutions-footer.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AhbTableComponent } from '../../components/ahb-table/ahb-table.component';
import { Ahb, AhbService } from '../../../../core/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, of } from 'rxjs';
import { map, shareReplay, catchError, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { AhbSearchFormHeaderComponent } from '../../components/ahb-search-form-header/ahb-search-form-header.component';
import { InputSearchEnhancedComponent } from '../../../../shared/components/input-search-enhanced/input-search-enhanced.component';
import { ExportButtonComponent } from '../../components/export-button/export-button.component';
import { IconCopyUrlComponent } from '../../../../shared/components/icon-copy-url/icon-copy-url.component';
import { FallbackPageComponent } from '../../../../shared/components/fallback-page/fallback-page.component';

@Component({
  selector: 'app-ahb-page',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent,
    SolutionsFooterComponent,
    AhbTableComponent,
    CommonModule,
    AhbSearchFormHeaderComponent,
    InputSearchEnhancedComponent,
    ExportButtonComponent,
    IconCopyUrlComponent,
    FallbackPageComponent,
  ],
  templateUrl: './ahb-page.component.html',
})
export class AhbPageComponent implements OnInit, OnDestroy {
  // State management
  formatVersion = signal<string>('');
  pruefi = signal<string>('');
  searchQuery = signal<string | undefined>('');
  edifactFormat = computed(() => this.getEdifactFormat(this.pruefi()));

  // View references
  table = viewChild(AhbTableComponent);
  scroll = viewChild<ElementRef>('scroll');

  // Data streams
  ahb$?: Observable<Ahb>;
  lines$?: Observable<Ahb['lines']>;
  errorOccurred = false;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly ahbService: AhbService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit() {
    // Handle route parameters
    this.route.params.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe(params => {
      const formatVersion = params['formatVersion'];
      const pruefi = params['pruefi'];

      if (formatVersion && pruefi) {
        this.formatVersion.set(formatVersion);
        this.pruefi.set(pruefi);
        this.loadAhbData(formatVersion, pruefi);
      }
    });

    // Handle search query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(params => {
        const query = params['query'];
        if (query) {
          this.searchQuery.set(query);
          this.triggerSearch(query);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAhbData(formatVersion: string, pruefi: string) {
    this.errorOccurred = false;

    this.ahb$ = this.ahbService
      .getAhb$Json({
        'format-version': formatVersion,
        pruefi: pruefi,
      })
      .pipe(
        shareReplay(1),
        catchError(error => {
          if (error.status === 404) {
            this.errorOccurred = true;
          }
          return of({} as Ahb);
        })
      );

    this.lines$ = this.ahb$.pipe(map(ahb => ahb.lines));
  }

  onFormatVersionChange(newFormatVersion: string) {
    this.router.navigate(['/ahb', newFormatVersion, this.pruefi()]);
  }

  onPruefiChange(newPruefi: string) {
    this.router.navigate(['/ahb', this.formatVersion(), newPruefi]);
  }

  triggerSearch(query: string | undefined) {
    if (!query) return;
  }

  scrollToElement(element: HTMLElement): void {
    const scrollContainer = this.scroll();
    if (!scrollContainer?.nativeElement) return;

    // Get the scroll container
    const container = scrollContainer.nativeElement;

    // Calculate position accounting for header offset
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scrollTop = elementRect.top - containerRect.top + container.scrollTop - 120; // 120px for header

    // Scroll smoothly to the element
    container.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    });
  }

  onSearchQueryChange(query: string | undefined) {
    this.searchQuery.set(query);
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
        sender: 'MSCONS-Nachrichten können von verschiedenen Marktrollen gesendet werden.',
        empfaenger: 'MSCONS-Nachrichten können von verschiedenen Marktrollen empfangen werden.',
      };
    }

    const [sender, empfaenger] = direction.split(' an ').map(part => part.trim());
    return { sender, empfaenger: empfaenger || '' };
  }
}
