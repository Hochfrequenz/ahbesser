import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
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
import {LoginButtonComponent} from "../../../../shared/components/login-button/login-button.component";

@Component({
  selector: 'app-ahb-landing-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    ReactiveFormsModule,
    FormatVersionSelectComponent,
    PruefiInputComponent,
    LoginButtonComponent,
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
