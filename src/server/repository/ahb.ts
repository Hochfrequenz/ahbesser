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
      meta: {
        description: firstLine.description || '',
        direction: firstLine.direction || '',
        pruefidentifikator: firstLine.pruefidentifikator,
      },
      lines: lines.map(line => ({
        ahb_expression: line.line_ahb_status || '',
        conditions: '', // This will be handled separately as mentioned in the view definition
        data_element: line.data_element?.startsWith('D_')
          ? line.data_element.substring(2)
          : line.data_element || '',
        guid: line.id,
        index: 0, // This will need to be calculated based on sort_path if needed
        name: line.line_name || '',
        section_name: '', // This might need to be derived from the path if needed
        segment_code: line.segment_code || '',
        segment_group_key: line.segmentgroup_key || '',
        value_pool_entry: line.qualifier || '',
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
    } catch {
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
