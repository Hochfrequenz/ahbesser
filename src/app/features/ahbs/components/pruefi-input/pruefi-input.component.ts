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
import { BehaviorSubject, Observable, combineLatest, map, of, tap } from 'rxjs';

interface PruefiOption {
  pruefidentifikator: string;
  name: string;
}

@Component({
  selector: 'app-pruefi-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pruefi-input.component.html',
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
  private searchTerm$ = new BehaviorSubject<string>('');
  private allPruefis$ = new BehaviorSubject<PruefiOption[]>([]);

  pruefis$: Observable<string[]> = combineLatest([this.searchTerm$, this.allPruefis$]).pipe(
    map(([searchTerm, pruefis]) => {
      if (!searchTerm) return pruefis.map(p => p.pruefidentifikator);
      const term = searchTerm.toLowerCase();
      return pruefis
        .filter(
          p =>
            p.pruefidentifikator.toLowerCase().includes(term) || p.name.toLowerCase().includes(term)
        )
        .map(p => `${p.pruefidentifikator} - ${p.name}`);
    })
  );

  public onChange?: (pruefi: string | null) => void;

  constructor(private readonly ahbService: AhbService) {
    effect(() => {
      const formatVersion = this.formatVersion();
      if (!formatVersion) {
        this.allPruefis$.next([]);
        return;
      }
      this.control.disable();
      this.ahbService
        .getPruefis({
          'format-version': formatVersion,
        })
        .pipe(tap(() => this.control.enable()))
        .subscribe(pruefis => {
          this.allPruefis$.next(
            pruefis.map(p => ({
              pruefidentifikator: p.pruefidentifikator || '',
              name: p.name || '',
            }))
          );
        });
    });
  }

  writeValue(pruefi: string): void {
    this.control.setValue(pruefi);
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

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value;

    // Update the search term for filtering suggestions
    this.searchTerm$.next(inputValue);

    let pruefidentifikator: string | null = null;

    // If the value contains a hyphen, it's from the suggestion list
    if (inputValue.includes(' - ')) {
      pruefidentifikator = inputValue.split(' - ')[0].trim();
    } else if (/^\d+$/.test(inputValue)) {
      // If the input is only digits, treat it as a pruefidentifikator
      pruefidentifikator = inputValue.slice(0, 5);
    }

    // Update the form control with the full input value to allow searching
    this.control.setValue(inputValue);

    // Only emit changes when we have a valid 5-digit pruefidentifikator
    if (this.onChange) {
      if (pruefidentifikator?.length === 5) {
        this.onChange(pruefidentifikator);
      } else {
        this.onChange(null);
      }
    }
  }
}
