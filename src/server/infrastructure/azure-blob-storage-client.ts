import { BlobServiceClient } from '@azure/storage-blob';

export function createNewBlobStorageClient(): BlobServiceClient {
  const connectionString = process.env['AZURE_BLOB_STORAGE_CONNECTION_STRING'];
  if (!connectionString) {
    throw new Error('AZURE_BLOB_STORAGE_CONNECTION_STRING is not set');
  }
  return BlobServiceClient.fromConnectionString(connectionString);
}
