import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AhbTableComponent } from '../../components/ahb-table/ahb-table.component';
import { Ahb, AhbService, FormatVersion } from '../../../../core/api';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, map, shareReplay } from 'rxjs';

@Component({
  selector: 'app-ahb-page',
  standalone: true,
  imports: [
    HeaderComponent,
    AhbTableComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './ahb-page.component.html',
})
export class AhbPageComponent implements OnChanges {
  @Input() formatVersion!: string;
  @Input() pruefi!: string;

  searchQuery = new FormControl('');

  ahb$?: Observable<Ahb>;
  lines$?: Observable<Ahb['lines']>;

  constructor(private readonly ahbService: AhbService) {}

  ngOnChanges(): void {
    this.ahb$ = this.ahbService
      .getAhb({
        'format-version': this.formatVersion as FormatVersion, // todo remove cast -> fix openapi spec
        pruefi: this.pruefi,
      })
      .pipe(shareReplay());
    this.lines$ = this.ahb$.pipe(map((ahb) => ahb.lines));
  }

  onSearchQueryChange() {
    console.log(this.searchQuery.value);
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
