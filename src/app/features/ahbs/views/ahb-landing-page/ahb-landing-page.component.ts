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

@Component({
  selector: 'app-ahb-landing-page',
  standalone: true,
  imports: [HeaderComponent, FormsModule, ReactiveFormsModule],
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
