import { BlobServiceClient } from "@azure/storage-blob";
import { createNewBlobStorageClient } from '../infrastructure/azure-blob-storage-client';
import { getFormatName } from "../domain/format";
import { Ahb } from "../../app/core/api/models";
import { Readable } from "stream";

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

    public async get(pruefi: string, formatVersion: string, type: FileType): Promise<Ahb> {
        const containerClient = this.blobServiceClient.getContainerClient(this.ahbContainerName);
        const blobName = this.getBlobName(pruefi, formatVersion, type);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const downloadedContent = await this.streamToString(downloadBlockBlobResponse.readableStreamBody as Readable);
        return JSON.parse(downloadedContent);
    }

    private getBlobName(pruefi: string, formatVersion: string, type: FileType): string {
        const format = getFormatName(pruefi, formatVersion);
        const fileFormatDirectoryName = this.getFileTypeDirectoryName(type);
        return `${formatVersion}/${format}/${fileFormatDirectoryName}/${pruefi}.${type.toString()}`;
    }

    private getFileTypeDirectoryName(fileType: FileType): string {
        switch (fileType) {
            case FileType.CSV:
                return "csv";
            case FileType.JSON:
                return "flatahb";
            case FileType.XLSC:
                return "xlsc";
            default:
                throw new Error("Unknown file type");
        }
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