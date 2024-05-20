import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { FormatVersionSelectComponent } from '../../components/format-version-select/format-version-select.component';
import { PruefiInputComponent } from '../../components/pruefi-input/pruefi-input.component';

@Component({
  selector: 'app-ahb-landing-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FormsModule,
    ReactiveFormsModule,
    FormatVersionSelectComponent,
    PruefiInputComponent,
  ],
  templateUrl: './ahb-landing-page.component.html',
})
export class AhbLandingPageComponent {
  form = new FormGroup({
    formatVersion: new FormControl('', Validators.required),
    pruefi: new FormControl('', Validators.required),
  });

  constructor(private readonly router: Router) {}

  onClickSubmit() {
    console.log(this.form.value);
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.router.navigate([
      '/ahb',
      this.form.value.formatVersion,
      this.form.value.pruefi,
    ]);
  }
}
