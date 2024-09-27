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
export class FormatVersionSelectComponent
  implements ControlValueAccessor, OnInit
{
  control = new FormControl<string>('');

  formatVersions$!: Observable<{ value: string; label: string }[]>;

  public onChange?: (formatVersion: string | null) => void;

  constructor(private readonly ahbService: AhbService) {}

  ngOnInit(): void {
    this.control.disable();
    this.formatVersions$ = this.ahbService.getFormatVersions().pipe(
      map((versions) =>
        versions.map((v) => ({
          value: v,
          label: this.getFormatVersionDate(v),
        })),
      ),
      tap(() => this.control.enable()),
    );
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
      FV2504: 'April 2025 (FV2504)',
      FV2510: 'Oktober 2025 (FV2510)',
      FV2604: 'April 2026 (FV2604)',
      FV2610: 'Oktober 2026 (FV2610)',
      FV2704: 'April 2027 (FV2704)',
      FV2710: 'Oktober 2027 (FV2710)',
      FV2804: 'April 2028 (FV2804)',
      FV2810: 'Oktober 2028 (FV2810)',
      FV2904: 'April 2029 (FV2904)',
      FV2910: 'Oktober 2029 (FV2910)',
      FV3004: 'April 2030 (FV3004)',
      FV3010: 'Oktober 2030 (FV3010)',
    };
    return mapping[formatVersion] || formatVersion;
  }
}
