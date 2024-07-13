import {
  Component,
  ElementRef,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { AhbTableComponent } from '../../components/ahb-table/ahb-table.component';
import { Ahb, AhbService } from '../../../../core/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, map, shareReplay } from 'rxjs';
import { AhbSearchFormHeaderComponent } from '../../components/ahb-search-form-header/ahb-search-form-header.component';
import { InputSearchEnhancedComponent } from '../../../../shared/components/input-search-enhanced/input-search-enhanced.component';
import { HighlightPipe } from '../../../../shared/pipes/highlight.pipe';
import { scrollToElement } from '../../../../core/helper/scroll-to-element';
import { ExportButtonComponent } from '../../components/export-button/export-button.component';
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
  ],
  templateUrl: './ahb-page.component.html',
})
export class AhbPageComponent {
  formatVersion = input.required<string>();
  pruefi = input.required<string>();

  table = viewChild(AhbTableComponent);
  scroll = viewChild<ElementRef>('scroll');

  searchQuery = signal<string | undefined>('');

  ahb$?: Observable<Ahb>;
  lines$?: Observable<Ahb['lines']>;

  constructor(private readonly ahbService: AhbService) {
    effect(() => {
      this.ahb$ = this.ahbService
        .getAhb({
          'format-version': this.formatVersion(),
          pruefi: this.pruefi(),
        })
        .pipe(shareReplay());
      this.lines$ = this.ahb$.pipe(map((ahb) => ahb.lines));
    });
  }

  onClickExport() {
    alert('not implemented');
  }

  scrollToElement(element: HTMLElement, offsetY: number): void {
    const scrollContainer = this.scroll();
    if (!scrollContainer?.nativeElement) {
      return;
    }
    scrollToElement(element, offsetY, scrollContainer.nativeElement);
  }
}
