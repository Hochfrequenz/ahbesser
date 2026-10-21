import { Component, input, output, effect, ChangeDetectionStrategy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PruefiInputComponent } from '../pruefi-input/pruefi-input.component';
import { FormatVersionSelectComponent } from '../format-version-select/format-version-select.component';

@Component({
  selector: 'app-ahb-search-form-header',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, FormatVersionSelectComponent, PruefiInputComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
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

  constructor() {
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

    // Emit the changed values so the hosting page can navigate. We deliberately emit the
    // value handed to us by `valueChanges` and do NOT navigate from here: when a single
    // control changes, its `valueChanges` fires before the parent FormGroup's aggregate
    // `.value`/`.valid` are recomputed, so re-reading `headerSearchForm.value` here would
    // yield the previous pruefi and navigate back to it (see issue #941).
    this.headerSearchForm.get('formatVersion')?.valueChanges.subscribe(value => {
      if (value) {
        this.formatVersionChange.emit(value);
      }
    });

    this.headerSearchForm.get('pruefi')?.valueChanges.subscribe(value => {
      if (value) {
        this.pruefiChange.emit(value);
      }
    });
  }
}
