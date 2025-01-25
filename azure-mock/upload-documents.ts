import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  newPipeline,
  ContainerClient,
} from '@azure/storage-blob';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Function to calculate MD5 hash of a file
const calculateFileHash = (filePath: string): string => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

// Function to create a BlobServiceClient
const createBlobServiceClient = () => {
  const azureHost = process.env['AZURE_STORAGE_HOST'] || 'http://127.0.0.1';
  const accountName = 'devstoreaccount1';
  const accountKey =
    'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==';
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
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

// Recursive function to get all uploadable files
const getUploadableFiles = (folderPath: string): string[] => {
  const results: string[] = [];
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);

    if (file.startsWith('.') || file.startsWith('README')) {
      continue;
    }

    const isValidDirectoryWithRequiredFiles =
      stat.isDirectory() &&
      (file.startsWith('FV') || edifactFormats.includes(file) || fileFormats.includes(file));

    if (isValidDirectoryWithRequiredFiles) {
      results.push(...getUploadableFiles(filePath));
    } else if (stat.isFile()) {
      results.push(filePath);
    }
  }

  return results;
};

// Function to check if blob exists and has same hash
const shouldUploadFile = async (
  filePath: string,
  blobName: string,
  containerClient: ContainerClient
): Promise<boolean> => {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  try {
    const properties = await blockBlobClient.getProperties();
    const localHash = calculateFileHash(filePath);
    const cloudHash = properties.metadata?.['fileHash'];
    return !cloudHash || cloudHash !== localHash;
  } catch {
    // If blob doesn't exist or other error, we should upload
    return true;
  }
};

// Function to upload a single file
const uploadSingleFile = async (
  filePath: string,
  basePath: string,
  containerClient: ContainerClient
): Promise<void> => {
  const blobName = path.relative(basePath, filePath).replace(/\\/g, '/');

  if (await shouldUploadFile(filePath, blobName, containerClient)) {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const fileHash = calculateFileHash(filePath);
    console.log(`Uploading ${filePath} as ${blobName}`);
    await blockBlobClient.uploadFile(filePath, {
      metadata: { fileHash },
    });
  } else {
    console.log(`Skipping ${blobName} - already exists with same hash`);
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
    console.log(`Starting upload of files from ${folderPath} to container '${containerName}'`);

    // Get all files first
    const allFiles = getUploadableFiles(folderPath);
    console.log(`Found ${allFiles.length} files to process`);

    // Upload files in parallel, but limit concurrency
    const concurrencyLimit = 5;
    for (let i = 0; i < allFiles.length; i += concurrencyLimit) {
      const batch = allFiles.slice(i, i + concurrencyLimit);
      await Promise.all(
        batch.map(filePath => uploadSingleFile(filePath, folderPath, containerClient))
      );
    }

    console.log('All files processed successfully.');
  } catch (error) {
    console.error('Error uploading files:', error);
  }
};

main();
