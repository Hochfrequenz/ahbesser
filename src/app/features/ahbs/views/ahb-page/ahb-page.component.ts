import { Component, effect, input } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AhbTableComponent } from '../../components/ahb-table/ahb-table.component';
import { Ahb, AhbService } from '../../../../core/api';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, map, shareReplay } from 'rxjs';
import { AhbSearchFormHeaderComponent } from '../../components/ahb-search-form-header/ahb-search-form-header.component';

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
  ],
  templateUrl: './ahb-page.component.html',
})
export class AhbPageComponent {
  formatVersion = input.required<string>();
  pruefi = input.required<string>();

  searchQuery = new FormControl('');

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

  onSearchQueryChange() {
    this.lines$ = this.ahb$?.pipe(
      map((ahb) => ahb.lines),
      map(
        (lines) =>
          lines.filter((line) =>
            JSON.stringify(line).includes(this.searchQuery.value ?? ''),
          ) ?? [],
      ),
    );
  }
}
