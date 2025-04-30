import * as XLSX from 'xlsx';
import { Ahb } from '../../app/core/api/models';

export class XlsxGeneratorService {
  public generateXlsx(ahb: Ahb): Buffer {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create the main data sheet
    const mainSheetData = this.prepareMainSheetData(ahb);
    const mainSheet = XLSX.utils.aoa_to_sheet(mainSheetData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'AHB');

    // Generate the Excel file as a buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private prepareMainSheetData(ahb: Ahb): any[][] {
    // Header row
    const headers = [
      'Segmentgruppe',
      'Segmentname',
      'Segment',
      'Datenelement',
      'Qualifier',
      'Name',
      'Pflichtfeld-Kennzeichen',
      'Bedingung / Hinweis / Format',
    ];

    // Data rows
    const rows = ahb.lines.map(line => [
      line.segment_group_key,
      line.section_name,
      line.segment_code,
      line.data_element,
      line.value_pool_entry,
      line.name,
      line.ahb_expression, // This maps to Pflichtfeld-Kennzeichen
      line.conditions, // This maps to Bedingung / Hinweis / Format
    ]);

    return [headers, ...rows];
  }
}
