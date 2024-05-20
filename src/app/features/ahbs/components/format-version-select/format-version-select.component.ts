import { Component, OnInit, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { AhbService } from '../../../../core/api';
import { Observable, tap } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-format-version-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './format-version-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormatVersionSelectComponent),
      multi: true,
    },
  ],
})
export class FormatVersionSelectComponent
  implements ControlValueAccessor, OnInit
{
  control = new FormControl<string>('');

  formatVersions$!: Observable<string[]>;

  public onChange?: (formatVersion: string | null) => void;

  constructor(private readonly ahbService: AhbService) {}

  ngOnInit(): void {
    this.control.disable();
    this.formatVersions$ = this.ahbService
      .getFormatVersions()
      .pipe(tap(() => this.control.enable()));
  }

  writeValue(formatVersion: string): void {
    this.control.setValue(formatVersion);
  }

  registerOnChange(fn: (formatVersion: string | null) => void): void {
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
}
