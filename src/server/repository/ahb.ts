import { BlobServiceClient } from "@azure/storage-blob";
import { createNewBlobStorageClient } from '../infrastructure/azure-blob-storage-client';
import { Ahb } from "../../app/core/api/models";
import { Readable } from "stream";
import { NotFoundError } from "../infrastructure/errors";

export enum FileType {
    CSV = "csv",
    JSON = "json",
    XLSC = "xlsc"
}

export default class AHBRepository {
    private blobServiceClient: BlobServiceClient;
    private ahbContainerName: string;
    constructor(client?: BlobServiceClient) {
       this.blobServiceClient = client ?? createNewBlobStorageClient();
       if (!process.env["AHB_CONTAINER_NAME"]) {
           throw new Error("AHB_CONTAINER_NAME is not set");
       }
         this.ahbContainerName = process.env["AHB_CONTAINER_NAME"];
    }

    // Retrieve a single AHB from the blob storage
    // 1. Get the container client (all AHB blobs are stored in the same container)
    // 2. Get the blob name based on the pruefi, formatVersion and file type
    // 3. Get the block blob client
    // 4. Download the blob
    // 5. Convert the blob content to a string
    // 6. Parse the string to an Ahb object
    public async get(pruefi: string, formatVersion: string, type: FileType): Promise<Ahb> {
        const containerClient = this.blobServiceClient.getContainerClient(this.ahbContainerName);
        const blobName = await this.getBlobName(pruefi, formatVersion, type);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const downloadedContent = await this.streamToString(downloadBlockBlobResponse.readableStreamBody as Readable);
        return JSON.parse(downloadedContent);
    }

    // Get the blob name based on the pruefi, formatVersion and file type.
    // Structure of a blob name: {formatVersion}/{format}/{fileTypeDirectory}/{pruefi}.{fileType}
    // This method needs to further to find {format} and {fileTypeDirectory}.
    private async getBlobName(pruefi: string, formatVersion: string, type: FileType): Promise<string> {
        const format = await this.getFormatName(pruefi, formatVersion);
        const fileFormatDirectoryName = this.getFileTypeDirectoryName(type);
        return `${formatVersion}/${format}/${fileFormatDirectoryName}/${pruefi}.${type.toString()}`;
    }

    // Get the directory name for a specified file type
    private getFileTypeDirectoryName(fileType: FileType): string {
        switch (fileType) {
            case FileType.CSV:
                return "csv";
            case FileType.JSON:
                return "flatahb";
            case FileType.XLSC:
                return "xlsc";
            default:
                throw new NotFoundError(`Unknown file type ${fileType}`);
        }
    }

    // Retrieve the format name by looking at the blobs names in the container.
    // Assuming each pruefi is unique for a formatVersion.
    private async getFormatName(pruefi: string, formatVersion: string): Promise<string> {
        const containerClient = this.blobServiceClient.getContainerClient(this.ahbContainerName);
        let blobsFound = false;
        for await (const blob of containerClient.listBlobsFlat({ prefix: `${formatVersion}/`})) {
            blobsFound = true;
            if (blob.name.includes(pruefi)) {
                return blob.name.split("/")[1];
            }
        }
        throw blobsFound
        ? new NotFoundError(`Pruefi ${pruefi} does not exist on Format Version ${formatVersion}`)
        : new NotFoundError(`Format Version ${formatVersion} does not exist`);
    }

    // Helper function to convert a stream to a string
    private async streamToString(readableStream: Readable): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: string[] = [];
            readableStream.on("data", (data: string | Buffer) => {
                chunks.push(data.toString());
            });
            readableStream.on("end", () => {
                resolve(chunks.join(""));
            });
            readableStream.on("error", reject);
        });
    }
}