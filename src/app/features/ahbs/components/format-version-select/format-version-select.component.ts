import { Component, OnInit, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { AhbService } from '../../../../core/api';
import { Observable, map, tap } from 'rxjs';
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
export class FormatVersionSelectComponent implements ControlValueAccessor, OnInit {
  control = new FormControl<string>('');

  formatVersions$!: Observable<{ value: string; label: string }[]>;

  public onChange?: (formatVersion: string | null) => void;

  constructor(private readonly ahbService: AhbService) {}

  ngOnInit(): void {
    this.control.disable();
    this.formatVersions$ = this.ahbService.getFormatVersions().pipe(
      map(versions =>
        versions.map(v => ({
          value: v,
          label: this.getFormatVersionDate(v),
        }))
      ),
      tap(() => {
        if (!this.control.value) {
          const defaultVersion = this.getDefaultFormatVersion();
          this.control.setValue(defaultVersion);
          if (this.onChange) {
            this.onChange(defaultVersion);
          }
        }
        this.control.enable();
      })
    );

    // Subscribe to value changes
    this.control.valueChanges.subscribe(value => {
      if (this.onChange) {
        this.onChange(value);
      }
    });
  }

  /**
   * Returns the default format version based on a series of predefined datetime upper thresholds.
   * Each threshold corresponds to a specific version of the Edifact format.
   * The thresholds are defined in UTC and are based on the official BDEW schedule.
   */
  private getDefaultFormatVersion(): string {
    const now = new Date();
    const formatVersionThresholds: [Date, string][] = [
      [new Date('2024-09-30T22:00:00Z'), 'FV2404'],
      [new Date('2025-06-05T22:00:00Z'), 'FV2410'],
      [new Date('2025-09-30T22:00:00Z'), 'FV2504'],
    ];

    for (const [thresholdDate, version] of formatVersionThresholds) {
      if (now < thresholdDate) {
        return version;
      }
    }

    return 'FV2510';
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

  private getFormatVersionDate(formatVersion: string): string {
    const mapping: { [key: string]: string } = {
      FV2104: 'April 2021 (FV2104)',
      FV2110: 'Oktober 2021 (FV2110)',
      FV2204: 'April 2022 (FV2204)',
      FV2210: 'Oktober 2022 (FV2210)',
      FV2304: 'April 2023 (FV2304)',
      FV2310: 'Oktober 2023 (FV2310)',
      FV2404: 'April 2024 (FV2404)',
      FV2410: 'Oktober 2024 (FV2410)',
      FV2504: 'Juni 2025 (FV2504)',
      FV2510: 'Oktober 2025 (FV2510)',
    };
    return mapping[formatVersion] || formatVersion;
  }
}
