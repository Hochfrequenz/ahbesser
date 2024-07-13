import { Component } from '@angular/core';

@Component({
  selector: 'app-export-button',
  standalone: true,
  templateUrl: './export-button.component.html',
})
export class ExportButtonComponent {
  constructor() {}

  onClickExport(): void {
    // Implement the export functionality here
    console.log('Export button clicked');
  }
}
