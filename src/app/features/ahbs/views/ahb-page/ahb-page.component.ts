import { Component, effect, input, signal } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AhbTableComponent } from '../../components/ahb-table/ahb-table.component';
import { Ahb, AhbService } from '../../../../core/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, map, shareReplay } from 'rxjs';
import { AhbSearchFormHeaderComponent } from '../../components/ahb-search-form-header/ahb-search-form-header.component';
import { InputSearchEnhancedComponent } from '../../../../shared/components/input-search-enhanced/input-search-enhanced.component';
import { HighlightPipe } from '../../../../shared/pipes/highlight.pipe';

@Component({
  selector: 'app-ahb-page',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    AhbTableComponent,
    CommonModule,
    AhbSearchFormHeaderComponent,
    InputSearchEnhancedComponent,
    HighlightPipe,
  ],
  templateUrl: './ahb-page.component.html',
})
export class AhbPageComponent {
  formatVersion = input.required<string>();
  pruefi = input.required<string>();

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
}
