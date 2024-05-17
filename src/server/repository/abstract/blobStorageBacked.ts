import { BlobServiceClient } from "@azure/storage-blob";
import { createNewBlobStorageClient } from "../../infrastructure/azure-blob-storage-client";
import { Readable } from "stream";

export default abstract class BlobStorageBacked {
    protected client: BlobServiceClient;
    constructor(client?: BlobServiceClient) {
        this.client = client ?? createNewBlobStorageClient();
    }

    // Helper function to convert a stream to a string
    protected async streamToString(readableStream: Readable): Promise<string> {
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
