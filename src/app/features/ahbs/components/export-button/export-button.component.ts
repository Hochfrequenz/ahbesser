import { Component, Input } from '@angular/core';
import { AhbService } from '../../../../core/api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-export-button',
  standalone: true,
  templateUrl: './export-button.component.html',
})
export class ExportButtonComponent {
  @Input() formatVersion!: string;
  @Input() pruefi!: string;

  constructor(private ahbService: AhbService) {}

  async onClickExport(): Promise<void> {
    const blob = await firstValueFrom(
      this.ahbService.getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet({
        'format-version': this.formatVersion,
        pruefi: this.pruefi,
        format: 'xlsx',
      }),
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AHB_${this.formatVersion}_${this.pruefi}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
