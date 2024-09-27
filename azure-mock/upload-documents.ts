import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  newPipeline,
} from '@azure/storage-blob';
import * as fs from 'fs';
import * as path from 'path';

// Function to create a BlobServiceClient
const createBlobServiceClient = () => {
  const azureHost = process.env['AZURE_STORAGE_HOST'] || 'http://127.0.0.1';
  const accountName = 'devstoreaccount1';
  const accountKey =
    'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==';
  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey,
  );
  const pipeline = newPipeline(sharedKeyCredential, {
    retryOptions: { maxTries: 4 }, // Retry options
    userAgentOptions: { userAgentPrefix: 'Sample V1.0.0' }, // User agent options
    keepAliveOptions: { enable: false }, // Keep alive options
  });

  return new BlobServiceClient(`${azureHost}:10000/${accountName}`, pipeline);
};

const edifactFormats = [
  'COMDIS',
  'IFTSTA',
  'INSRPT',
  'INVOIC',
  'MSCONS',
  'ORDCHG',
  'ORDERS',
  'ORDRSP',
  'PARTIN',
  'PRICAT',
  'QUOTES',
  'REMADV',
  'REQOTE',
  'UTILMD',
  'UTILTS',
];
const fileFormats = ['csv', 'flatahb', 'xlsx'];

// Recursive function to upload files
const uploadFiles = async (
  folderPath: string,
  containerClient: ContainerClient,
) => {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);

    // Skip hidden files and README
    if (file.startsWith('.') || file.startsWith('README')) {
      continue;
    }

    const isValidDirectoryWithRequiredFiles =
      stat.isDirectory() &&
      (file.startsWith('FV') ||
        edifactFormats.includes(file) ||
        fileFormats.includes(file));

    if (isValidDirectoryWithRequiredFiles) {
      await uploadFiles(filePath, containerClient);
    } else {
      const blobName = path
        .relative(process.argv[2], filePath)
        .replace(/\\/g, '/');
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      console.log(`Uploading ${filePath} as ${blobName}`);
      await blockBlobClient.uploadFile(filePath);
    }
  }
};

// Main function to handle the upload process
const main = async () => {
  if (process.argv.length < 3) {
    console.log('Usage: node dist/uploadFilesToAzurite.js <folderPath>');
    return;
  }

  const folderPath = process.argv[2];
  const containerName = 'uploaded-files';
  const blobServiceClient = createBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);

  try {
    await containerClient.createIfNotExists();
    console.log(
      `Starting upload of files from ${folderPath} to container '${containerName}'`,
    );
    await uploadFiles(folderPath, containerClient);
    console.log('All files uploaded successfully.');
  } catch (error) {
    console.error('Error uploading files:', error);
  }
};

main();
