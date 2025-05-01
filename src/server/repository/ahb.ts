import { Ahb } from '../../app/core/api/models';
import { NotFoundError } from '../infrastructure/errors';
import { AppDataSource } from '../infrastructure/database';
import { AhbLine } from '../entities/ahb-line.entity';
import { XlsxGeneratorService } from '../infrastructure/xlsx-generator.service';

export enum FileType {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
}

export default class AHBRepository {
  private xlsxGenerator: XlsxGeneratorService;

  constructor() {
    this.xlsxGenerator = new XlsxGeneratorService();
  }

  // Retrieve a single AHB from either database (JSON) or generate XLSX on the fly
  public async get(pruefi: string, formatVersion: string, type: FileType): Promise<Ahb | Buffer> {
    if (type === FileType.JSON) {
      return this.getFromDatabase(pruefi, formatVersion);
    } else if (type === FileType.XLSX) {
      const ahb = await this.getFromDatabase(pruefi, formatVersion);
      return this.xlsxGenerator.generateXlsx(ahb);
    } else {
      throw new Error('Unsupported file type');
    }
  }

  private mapMetaInformation(line: AhbLine): Ahb['meta'] {
    return {
      description: line.description || '',
      direction: line.direction || '',
      pruefidentifikator: line.pruefidentifikator,
    };
  }

  private mapLine(line: AhbLine): Ahb['lines'][0] {
    const isSectionLine = line.line_type === 'segment' || line.line_type === 'segment_group';
    return {
      ahb_expression: line.line_ahb_status || '',
      conditions: line.bedingung || '',
      data_element: line.data_element?.startsWith('D_')
        ? line.data_element.substring(2)
        : line.data_element || '',
      guid: line.id,
      index: 0, // This will need to be calculated based on sort_path if needed
      name: isSectionLine ? '' : line.line_name || '',
      section_name: isSectionLine ? line.line_name || '' : '',
      segment_code: line.segment_code || '',
      segment_group_key: line.segmentgroup_key || '',
      value_pool_entry: line.qualifier || '',
      line_type: line.line_type || '',
    };
  }

  private async getFromDatabase(pruefi: string, formatVersion: string): Promise<Ahb> {
    // Initialize the database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get the lines from the database view
    const lines = await AppDataSource.getRepository(AhbLine)
      .createQueryBuilder('al')
      .where('al.format_version = :formatVersion', { formatVersion })
      .andWhere('al.pruefidentifikator = :pruefi', { pruefi })
      .orderBy('al.sort_path', 'ASC')
      .getMany();

    if (lines.length === 0) {
      throw new NotFoundError(
        `AHB document not found. Prüfidentifikator: ${pruefi}, Format Version: ${formatVersion}`
      );
    }

    // Get the first line to extract meta information
    const firstLine = lines[0];

    // Transform the data to match the API schema
    return {
      meta: this.mapMetaInformation(firstLine),
      lines: lines.map(line => this.mapLine(line)),
    };
  }
}
