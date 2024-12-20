import { BlobServiceClient } from '@azure/storage-blob';
import { Readable } from 'stream';
import { Ahb } from '../../app/core/api/models';
import { NotFoundError } from '../infrastructure/errors';
import BlobStorageBacked from './abstract/blobStorageBacked';

export enum FileType {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
}

export default class AHBRepository extends BlobStorageBacked {
  private ahbContainerName: string;
  constructor(client?: BlobServiceClient) {
    super(client);
    if (!process.env['AHB_CONTAINER_NAME']) {
      throw new Error('AHB_CONTAINER_NAME is not set');
    }
    this.ahbContainerName = process.env['AHB_CONTAINER_NAME'];
  }

  // Retrieve a single AHB from the blob storage
  // 1. Get the container client (all AHB blobs are stored in the same container)
  // 2. Get the blob name based on the pruefi, formatVersion and file type
  // 3. Get the block blob client
  // 4. Download the blob
  // 5. Convert the blob content to a string
  // 6. Parse the string to an Ahb object
  public async get(
    pruefi: string,
    formatVersion: string,
    type: FileType,
  ): Promise<Ahb | Buffer> {
    const containerClient = this.client.getContainerClient(
      this.ahbContainerName,
    );
    const blobName = await this.getBlobName(pruefi, formatVersion, type);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadBlockBlobResponse = await blockBlobClient.download(0);

    const content = await this.streamToBuffer(
      downloadBlockBlobResponse.readableStreamBody as Readable,
    );

    if (type === FileType.JSON) {
      const jsonString = content.toString('utf-8');
      return JSON.parse(jsonString) as Ahb;
    }

    return content;
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

  // Get the blob name based on the pruefi, formatVersion and file type.
  // Structure of a blob name: {formatVersion}/{format}/{fileTypeDirectory}/{pruefi}.{fileType}
  // This method needs to further to find {format} and {fileTypeDirectory}.
  private async getBlobName(
    pruefi: string,
    formatVersion: string,
    type: FileType,
  ): Promise<string> {
    const format = await this.getFormatName(pruefi);
    const fileFormatDirectoryName = this.getFileTypeDirectoryName(type);
    return `${formatVersion}/${format}/${fileFormatDirectoryName}/${pruefi}.${type.toString()}`;
  }

  // Get the directory name for a specified file type
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

  // Retrieve the format name by looking at the blobs names in the container.
  // Assuming each pruefi is unique for a formatVersion.
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
