import { Component, effect, input, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { PruefiInputComponent } from '../pruefi-input/pruefi-input.component';
import { FormatVersionSelectComponent } from '../format-version-select/format-version-select.component';

@Component({
  selector: 'app-ahb-search-form-header',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FormatVersionSelectComponent,
    PruefiInputComponent,
  ],
  templateUrl: './ahb-search-form-header.component.html',
})
export class AhbSearchFormHeaderComponent {
  formatVersion = input.required<string>();
  pruefi = input.required<string>();

  formatVersionChange = output<string>();

  headerSearchForm = new FormGroup({
    formatVersion: new FormControl('', Validators.required),
    pruefi: new FormControl('', Validators.required),
  });

  constructor(private readonly router: Router) {
    effect(() => {
      this.headerSearchForm.setValue({
        formatVersion: this.formatVersion(),
        pruefi: this.pruefi(),
      });
    });

    this.headerSearchForm
      .get('formatVersion')
      ?.valueChanges.subscribe((value) => {
        if (value) {
          this.formatVersionChange.emit(value);
        }
      });
  }

  onPruefiSelect() {
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
