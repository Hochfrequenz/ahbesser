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
import { of, tap } from 'rxjs';

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

  pruefis$!: ReturnType<AhbService['getPruefis']>;

  public onChange?: (pruefi: string | null) => void;

  constructor(private readonly ahbService: AhbService) {
    effect(() => {
      const formatVersion = this.formatVersion();
      if (!formatVersion) {
        this.pruefis$ = of([]);
        return;
      }
      this.control.disable();
      this.pruefis$ = this.ahbService
        .getPruefis({
          'format-version': formatVersion,
        })
        .pipe(tap(() => this.control.enable()));
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
    let value = input.value.replace(/[^0-9]/g, '');
    value = value.slice(0, 5);
    this.control.setValue(value);
    if (this.onChange) {
      this.onChange(value);
    }
  }
}
