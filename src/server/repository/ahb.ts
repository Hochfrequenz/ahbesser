import { BlobServiceClient } from '@azure/storage-blob';
import { Readable } from 'stream';
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
  private blobClient?: BlobServiceClient;
  private ahbContainerName?: string;

  constructor(client?: BlobServiceClient) {
    if (client) {
      this.blobClient = client;
      this.ahbContainerName = process.env['AHB_CONTAINER_NAME'];
    }
  }

  // Retrieve a single AHB from either database (JSON) or blob storage (XLSX/CSV)
  public async get(pruefi: string, formatVersion: string, type: FileType): Promise<Ahb | Buffer> {
    if (type === FileType.JSON) {
      return this.getFromDatabase(pruefi, formatVersion);
    } else {
      return this.getFromBlobStorage(pruefi, formatVersion, type);
    }
  }

  private async getFromDatabase(pruefi: string, formatVersion: string): Promise<Ahb> {
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
    return {
      meta: {
        description: metaInfo.description || '',
        direction: metaInfo.direction || '',
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
  }

  private async getFromBlobStorage(
    pruefi: string,
    formatVersion: string,
    type: FileType
  ): Promise<Buffer> {
    if (!this.blobClient || !this.ahbContainerName) {
      // Initialize blob client if not already done
      if (!process.env['AZURE_BLOB_STORAGE_CONNECTION_STRING']) {
        throw new NotFoundError(
          'Azure Blob Storage connection string is not configured (AZURE_BLOB_STORAGE_CONNECTION_STRING)'
        );
      }
      if (!process.env['AHB_CONTAINER_NAME']) {
        throw new NotFoundError('AHB container name is not configured (AHB_CONTAINER_NAME)');
      }
      this.blobClient = BlobServiceClient.fromConnectionString(
        process.env['AZURE_BLOB_STORAGE_CONNECTION_STRING']
      );
      this.ahbContainerName = process.env['AHB_CONTAINER_NAME'];
    }

    const containerClient = this.blobClient.getContainerClient(this.ahbContainerName);
    const blobName = await this.getBlobName(pruefi, formatVersion, type);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
      const downloadBlockBlobResponse = await blockBlobClient.download(0);
      return await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody as Readable);
    } catch (error) {
      throw new NotFoundError(
        `File not found for pruefi ${pruefi} and format version ${formatVersion}`
      );
    }
  }

  private async streamToBuffer(readableStream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data: Buffer | string) => {
        chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  private async getBlobName(
    pruefi: string,
    formatVersion: string,
    type: FileType
  ): Promise<string> {
    const format = await this.getFormatName(pruefi);
    const fileFormatDirectoryName = this.getFileTypeDirectoryName(type);
    return `${formatVersion}/${format}/${fileFormatDirectoryName}/${pruefi}.${type.toString()}`;
  }

  private getFileTypeDirectoryName(fileType: FileType): string {
    switch (fileType) {
      case FileType.CSV:
        return 'csv';
      case FileType.JSON:
        return 'flatahb';
      case FileType.XLSX:
        return 'xlsx';
      default:
        throw new NotFoundError(`Unknown file type ${fileType}`);
    }
  }

  private getFormatName(pruefi: string): string {
    const mapping: { [key: string]: string } = {
      '99': 'APERAK',
      '29': 'COMDIS',
      '21': 'IFTSTA',
      '23': 'INSRPT',
      '31': 'INVOIC',
      '13': 'MSCONS',
      '39': 'ORDCHG',
      '17': 'ORDERS',
      '19': 'ORDRSP',
      '27': 'PRICAT',
      '15': 'QUOTES',
      '33': 'REMADV',
      '35': 'REQOTE',
      '37': 'PARTIN',
      '11': 'UTILMD',
      '25': 'UTILTS',
      '91': 'CONTRL',
      '92': 'APERAK',
      '44': 'UTILMD', // UTILMD for GAS since FV2310
      '55': 'UTILMD', // UTILMD for STROM since FV2310
    };
    return mapping[pruefi.slice(0, 2)];
  }
}
