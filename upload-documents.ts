import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import * as fs from "fs";
import * as path from "path";

// Function to create a BlobServiceClient
const createBlobServiceClient = () => {
    const connectionString = "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;";
    return BlobServiceClient.fromConnectionString(connectionString);
};

// Recursive function to upload files
const uploadFiles = async (folderPath: string, containerClient: ContainerClient) => {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            await uploadFiles(filePath, containerClient);
        } else {
            const blobName = path.relative(process.argv[2], filePath).replace(/\\/g, "/");
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            console.log(`Uploading ${filePath} as ${blobName}`);
            await blockBlobClient.uploadFile(filePath);
        }
    }
};

// Main function to handle the upload process
const main = async () => {
    if (process.argv.length < 3) {
        console.log("Usage: node dist/uploadFilesToAzurite.js <folderPath>");
        return;
    }

    const folderPath = process.argv[2];
    const containerName = "uploaded-files";
    const blobServiceClient = createBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);

    try {
        await containerClient.createIfNotExists();
        console.log(`Starting upload of files from ${folderPath} to container '${containerName}'`);
        await uploadFiles(folderPath, containerClient);
        console.log("All files uploaded successfully.");
    } catch (error) {
        console.error("Error uploading files:", error);
    }
};

main();
