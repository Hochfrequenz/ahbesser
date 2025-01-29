import { Ahb } from '../../app/core/api/models';
import { NotFoundError } from '../infrastructure/errors';
import { AppDataSource } from '../infrastructure/database';
import { AhbMetaInformation } from '../entities/ahb-meta-information.entity';
import { AhbLine } from '../entities/ahb-line.entity';

export enum FileType {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
}

export default class AHBRepository {
  // Retrieve a single AHB from the database
  public async get(pruefi: string, formatVersion: string, type: FileType): Promise<Ahb | Buffer> {
    // Initialize the database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get the meta information and lines from the database
    const metaInfo = await AppDataSource.getRepository(AhbMetaInformation)
      .createQueryBuilder('ami')
      .where('ami.edifact_format_version = :formatVersion', { formatVersion })
      .andWhere('ami.pruefidentifikator = :pruefi', { pruefi })
      .getOne();

    if (!metaInfo) {
      throw new NotFoundError(
        `AHB not found for pruefi ${pruefi} and format version ${formatVersion}`
      );
    }

    const lines = await AppDataSource.getRepository(AhbLine)
      .createQueryBuilder('al')
      .where('al.ahb_id = :ahbId', { ahbId: metaInfo.ahb_id })
      .orderBy('al.position_inside_ahb', 'ASC')
      .getMany();

    // Transform the data to match the API schema
    const ahb: Ahb = {
      meta: {
        description: metaInfo.description || '',
        direction: metaInfo.direction || '',
        maus_version: '0.3.1', // TODO: Add this to the database schema
        pruefidentifikator: metaInfo.pruefidentifikator,
      },
      lines: lines.map(line => ({
        ahb_expression: line.ahb_expression || '',
        conditions: line.conditions || '',
        data_element: line.data_element || '',
        guid: line.id,
        index: line.index || 0,
        name: line.name || '',
        section_name: line.section_name || '',
        segment_code: line.segment_code || '',
        segment_group_key: line.segment_group_key || '',
        value_pool_entry: line.value_pool_entry || '',
      })),
    };

    // For now, we only support JSON output
    if (type !== FileType.JSON) {
      throw new NotFoundError(`File type ${type} is not supported yet`);
    }

    return ahb;
  }
}
