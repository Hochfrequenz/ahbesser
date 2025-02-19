import { Component, input, output, effect } from '@angular/core';
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
  imports: [FormsModule, ReactiveFormsModule, FormatVersionSelectComponent, PruefiInputComponent],
  templateUrl: './ahb-search-form-header.component.html',
})
export class AhbSearchFormHeaderComponent {
  formatVersion = input.required<string>();
  pruefi = input.required<string>();

  formatVersionChange = output<string>();
  pruefiChange = output<string>();

  headerSearchForm = new FormGroup({
    formatVersion: new FormControl('', Validators.required),
    pruefi: new FormControl('', Validators.required),
  });

  constructor(private readonly router: Router) {
    // Update form when inputs change
    effect(() => {
      const newFormatVersion = this.formatVersion();
      if (newFormatVersion !== this.headerSearchForm.get('formatVersion')?.value) {
        this.headerSearchForm.patchValue({ formatVersion: newFormatVersion }, { emitEvent: false });
      }
    });

    effect(() => {
      const newPruefi = this.pruefi();
      if (newPruefi !== this.headerSearchForm.get('pruefi')?.value) {
        this.headerSearchForm.patchValue({ pruefi: newPruefi }, { emitEvent: false });
      }
    });

    // Handle form control changes
    this.headerSearchForm.get('formatVersion')?.valueChanges.subscribe(value => {
      if (value) {
        this.formatVersionChange.emit(value);
      }
    });

    this.headerSearchForm.get('pruefi')?.valueChanges.subscribe(value => {
      if (value) {
        this.pruefiChange.emit(value);
        this.navigateToAhb();
      }
    });
  }

  private navigateToAhb() {
    if (this.headerSearchForm.valid) {
      this.router.navigate([
        '/ahb',
        this.headerSearchForm.value.formatVersion,
        this.headerSearchForm.value.pruefi,
      ]);
    }
  }
}
