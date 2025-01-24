import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import BlobStorageContainerBacked from './abstract/blobStorageBacked';
import { Readable } from 'stream';
import { NotFoundError } from '../infrastructure/errors';

interface FormatVersionsWithPruefis {
  [formatVersion: string]: Set<string>;
}

// The FormatVersionRepository class is responsible for retrieving the format versions and their related pruefis.
// This could be done by just using the AHB Container, but this would require iterating over all blobs and formatting them for each request.
// By storing the format versions in a separate container, we can reduce the number of requests to the blob storage and save computation time.
// This repository creates the format version container itself if it does not exist.
export default class FormatVersionRepository extends BlobStorageContainerBacked {
  private ahbContainerName: string;
  private formatVersionContainerName: string;
  constructor(client?: BlobServiceClient) {
    super(client);
    if (!process.env['AHB_CONTAINER_NAME']) {
      throw new Error('AHB_CONTAINER_NAME is not set');
    }
    this.ahbContainerName = process.env['AHB_CONTAINER_NAME'];

    if (!process.env['FORMAT_VERSION_CONTAINER_NAME']) {
      throw new Error('FORMAT_VERSION_CONTAINER_NAME is not set');
    }
    this.formatVersionContainerName = process.env['FORMAT_VERSION_CONTAINER_NAME'];
  }

  // Return a list of all unique format versions by looking at the top-level directories
  // in the uploaded-files container that start with 'FV'
  public async list(): Promise<string[]> {
    const containerClient = this.client.getContainerClient(this.ahbContainerName);
    const formatVersions = new Set<string>();

    for await (const blob of containerClient.listBlobsFlat()) {
      const parts = blob.name.split('/');
      if (parts.length > 0 && parts[0].startsWith('FV')) {
        formatVersions.add(parts[0]);
      }
    }

    return Array.from(formatVersions).sort();
  }

  // Return a list of all pruefis for a specific format version by looking at the json files
  // in the flatahb directory of the format version
  public async listPruefisByFormatVersion(formatVersion: string): Promise<string[]> {
    const containerClient = this.client.getContainerClient(this.ahbContainerName);
    const pruefis = new Set<string>();

    // List all blobs in the container with the prefix of the format version
    for await (const blob of containerClient.listBlobsFlat({ prefix: `${formatVersion}/` })) {
      // Check if the blob is in the flatahb directory and is a json file
      if (blob.name.includes('/flatahb/') && blob.name.endsWith('.json')) {
        // Extract the pruefi from the filename (remove .json extension)
        const pruefi = blob.name.split('/').pop()?.replace('.json', '');
        if (pruefi) {
          pruefis.add(pruefi);
        }
      }
    }

    if (pruefis.size === 0) {
      throw new NotFoundError(`Format version ${formatVersion} does not exist`);
    }

    return Array.from(pruefis).sort();
  }

  // Get the format versions container client. Create the container if it does not exist.
  private async getFormatVersionsContainerClient(): Promise<ContainerClient> {
    const containerClient = this.client.getContainerClient(this.formatVersionContainerName);
    if (!(await containerClient.exists())) {
      await this.createFormatVersionContainer();
    }
    return containerClient;
  }
  // Create the format version container
  // 1. Create the container client
  // 2. Build a list of format versions with the related pruefis
  // 3. Create a blob for each format version
  // 4. Upload the pruefis to the blob
  private async createFormatVersionContainer(): Promise<void> {
    console.log('Creating format version container');
    const containerClient = this.client.getContainerClient(this.formatVersionContainerName);
    await containerClient.createIfNotExists();
    const formatVersionsWithPruefis = await this.buildFormatVersionsWithPruefis();
    const promises = [];
    for (const formatVersion in formatVersionsWithPruefis) {
      const blobClient = containerClient.getBlockBlobClient(formatVersion);
      const data = Buffer.from(
        JSON.stringify(Array.from(formatVersionsWithPruefis[formatVersion]))
      );
      promises.push(blobClient.uploadData(data));
    }
    await Promise.all(promises);
  }

  // Build a list of format versions with the related pruefis
  // 1. Get the container client which stores the AHB blobs
  // 2. Iterate over all blobs in the container
  // 3. Parse the blob name to extract the format version and pruefi
  // 4. Store the pruefi in the formatVersionsWithPruefis object
  // 5. Return the object
  private async buildFormatVersionsWithPruefis(): Promise<FormatVersionsWithPruefis> {
    const containerClient = this.client.getContainerClient(this.ahbContainerName);
    const formatVersionBlobStorage: FormatVersionsWithPruefis = {};
    for await (const blob of containerClient.listBlobsFlat()) {
      const formatVersion = blob.name.split('/')[0];
      if (!formatVersionBlobStorage[formatVersion]) {
        formatVersionBlobStorage[formatVersion] = new Set();
      }
      const pruefi = blob.name.split('/')[3].split('.')[0];
      formatVersionBlobStorage[formatVersion].add(pruefi);
    }
    return formatVersionBlobStorage;
  }
}
