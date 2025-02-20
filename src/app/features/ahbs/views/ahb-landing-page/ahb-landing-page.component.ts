import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SolutionsFooterComponent } from '../../../../shared/components/solutions-footer/solutions-footer.component';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AhbSearchFormHeaderComponent } from '../../components/ahb-search-form-header/ahb-search-form-header.component';
import { InputSearchEnhancedComponent } from '../../../../shared/components/input-search-enhanced/input-search-enhanced.component';

@Component({
  selector: 'app-ahb-landing-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    ReactiveFormsModule,
    AhbSearchFormHeaderComponent,
    InputSearchEnhancedComponent,
    SolutionsFooterComponent,
  ],
  templateUrl: './ahb-landing-page.component.html',
})
export class AhbLandingPageComponent {
  form = new FormGroup({
    formatVersion: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    pruefi: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private readonly router: Router) {
    // Subscribe to pruefi value changes
    this.form.controls.pruefi.valueChanges.subscribe(value => {
      // If we have a 5-digit number and a format version, navigate immediately
      if (value?.match(/^\d{5}$/) && this.form.controls.formatVersion.value) {
        this.onClickSubmit();
      }
    });
  }

  onClickSubmit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.router.navigate(['/ahb', this.form.value.formatVersion, this.form.value.pruefi]);
  }
}
