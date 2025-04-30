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
      'Segment',
      'Segmentgruppe',
      'Datenelement',
      'Bedingung',
      'Wert',
      'Beschreibung',
      'AHB-Expression',
      'Richtung',
    ];

    // Data rows
    const rows = ahb.lines.map(line => [
      line.segment_code,
      line.segment_group_key,
      line.data_element,
      line.conditions,
      line.value_pool_entry,
      line.name || line.section_name,
      line.ahb_expression,
      ahb.meta.direction,
    ]);

    return [headers, ...rows];
  }
}
