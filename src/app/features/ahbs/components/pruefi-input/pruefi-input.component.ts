import { Component, effect, forwardRef, input } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { AhbService } from '../../../../core/api';
import { CommonModule } from '@angular/common';
import {
  Observable,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

interface PruefiOption {
  pruefidentifikator: string;
  name: string;
}

@Component({
  selector: 'app-pruefi-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './pruefi-input.component.html',
  styles: [
    `
      :host {
        display: block;
      }
      ::ng-deep .mat-mdc-form-field {
        width: 100%;
      }
      ::ng-deep .mat-mdc-option {
        font-size: 14px;
        height: auto !important;
        line-height: 1.2;
        padding: 8px 16px;
      }
      ::ng-deep .mat-mdc-option .mdc-list-item__primary-text {
        white-space: normal;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PruefiInputComponent),
      multi: true,
    },
  ],
})
export class PruefiInputComponent implements ControlValueAccessor {
  formatVersion = input.required<string | null>();

  control = new FormControl<string>('');
  filteredOptions$: Observable<PruefiOption[]>;

  public onChange?: (pruefi: string | null) => void;
  private allOptions: PruefiOption[] = [];

  constructor(private readonly ahbService: AhbService) {
    // Set up the filtering logic
    this.filteredOptions$ = this.control.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        if (typeof value === 'string') {
          return this.filterOptions(value);
        }
        return this.allOptions;
      })
    );

    // Load pruefis when format version changes
    effect(() => {
      const formatVersion = this.formatVersion();
      if (!formatVersion) {
        this.allOptions = [];
        return;
      }

      this.control.disable();
      this.ahbService
        .getPruefis({
          'format-version': formatVersion,
        })
        .subscribe(pruefis => {
          this.allOptions = pruefis.map(p => ({
            pruefidentifikator: p.pruefidentifikator || '',
            name: p.name || '',
          }));
          this.control.enable();
        });
    });
  }

  private filterOptions(value: string): PruefiOption[] {
    const filterValue = value.toLowerCase();
    return this.allOptions.filter(
      option =>
        option.pruefidentifikator.toLowerCase().includes(filterValue) ||
        option.name.toLowerCase().includes(filterValue)
    );
  }

  writeValue(pruefi: string): void {
    const option = this.allOptions.find(opt => opt.pruefidentifikator === pruefi);
    if (option) {
      this.control.setValue(option.pruefidentifikator);
    } else {
      this.control.setValue(pruefi);
    }
  }

  registerOnChange(fn: (pruefi: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {
    // do nothing
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  onOptionSelected(option: PruefiOption): void {
    if (this.onChange) {
      this.onChange(option.pruefidentifikator);
    }
  }
}
