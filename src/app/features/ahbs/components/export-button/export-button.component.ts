import { Component, Input } from '@angular/core';
import { AhbService } from '../../../../core/api';

@Component({
  selector: 'app-export-button',
  standalone: true,
  templateUrl: './export-button.component.html',
})
export class ExportButtonComponent {
  @Input() formatVersion!: string;
  @Input() pruefi!: string;

  constructor(private ahbService: AhbService) {}

  onClickExport(): void {
    this.ahbService
      .getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet({
        'format-version': this.formatVersion,
        pruefi: this.pruefi,
        format: 'xlsx',
      })
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `AHB_${this.formatVersion}_${this.pruefi}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('error downloading XLSX:', error);
        },
      });
  }
}
