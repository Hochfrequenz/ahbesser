import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  effect,
  input,
} from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AhbTableComponent } from '../../components/ahb-table/ahb-table.component';
import { Ahb, AhbService, FormatVersion } from '../../../../core/api';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable, map, shareReplay } from 'rxjs';
import { Router } from '@angular/router';
import { FormatVersionSelectComponent } from '../../components/format-version-select/format-version-select.component';
import { PruefiInputComponent } from '../../components/pruefi-input/pruefi-input.component';

@Component({
  selector: 'app-ahb-page',
  standalone: true,
  imports: [
    HeaderComponent,
    AhbTableComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormatVersionSelectComponent,
    PruefiInputComponent,
  ],
  templateUrl: './ahb-page.component.html',
})
export class AhbPageComponent {
  formatVersion = input.required<string>();
  pruefi = input.required<string>();

  searchQuery = new FormControl('');

  ahb$?: Observable<Ahb>;
  lines$?: Observable<Ahb['lines']>;

  headerSearchForm = new FormGroup({
    formatVersion: new FormControl('', Validators.required),
    pruefi: new FormControl('', Validators.required),
  });

  constructor(
    private readonly ahbService: AhbService,
    private readonly router: Router,
  ) {
    effect(() => {
      this.ahb$ = this.ahbService
        .getAhb({
          'format-version': this.formatVersion(),
          pruefi: this.pruefi(),
        })
        .pipe(shareReplay());
      this.lines$ = this.ahb$.pipe(map((ahb) => ahb.lines));
      setTimeout(() => {
        this.headerSearchForm.setValue({
          formatVersion: this.formatVersion(),
          pruefi: this.pruefi(),
        });
      }, 1000);
      console.log(
        this.formatVersion(),
        this.pruefi(),
        this.headerSearchForm.value,
      );
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

  onClickHeaderSearchSubmit() {
    if (!this.headerSearchForm.valid) {
      this.headerSearchForm.markAllAsTouched();
      return;
    }
    this.router.navigate([
      '/ahb',
      this.headerSearchForm.value.formatVersion,
      this.headerSearchForm.value.pruefi,
    ]);
  }
}
