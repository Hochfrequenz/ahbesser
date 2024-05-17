import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import BlobStorageContainerBacked from "./abstract/blobStorageBacked";
import { Readable } from "stream";
import { NotFoundError } from "../infrastructure/errors";

interface FormatVersionsWithPruefis {
    [formatVersion: string]: Set<string>;
}

// The FormatVersionRepository class is responsible for retreiving the format versions and their related pruefis.
// This could be done by just using the AHB Container, but this would require iterating over all blobs and formatting them for each request.
// By storing the format versions in a separate container, we can reduce the number of requests to the blob storage and save computation time.
// This repository creates the format version container itself if it does not exist.
export default class FormatVersionRepository extends BlobStorageContainerBacked {
    private ahbContainerName: string;
    private formatVersionContainerName: string;
    constructor(client?: BlobServiceClient) {
        super(client);
        if (!process.env["AHB_CONTAINER_NAME"]) {
            throw new Error("AHB_CONTAINER_NAME is not set");
        }
        this.ahbContainerName = process.env["AHB_CONTAINER_NAME"];

        if (!process.env["FORMAT_VERSION_CONTAINER_NAME"]) {
            throw new Error("FORMAT_VERSION_CONTAINER_NAME is not set");
        }  
        this.formatVersionContainerName = process.env["FORMAT_VERSION_CONTAINER_NAME"];
    }

    // Return a list of all unique format versions
    // 1. Get the container client which stores the format versions
    // 2. Iterate over all blobs in the container
    // 3. Return the list of format versions
    public async list(): Promise<string[]> {
        const containerClient = await this.getFormatVersionsContainerClient();
        const formatVersions: string[] = [];
        for await (const blob of containerClient.listBlobsFlat()) {
            formatVersions.push(blob.name);
        }
        return formatVersions;
    }

    // Return a list of all pruefis for a specific format version
    // 1. Get the container client which stores the format versions
    // 2. Get the blob client for the specified format version
    // 3. Download the blob
    // 4. Convert the blob content to a string
    // 5. Parse the string to a list of pruefis
    public async listPruefisByFormatVersion(formatVersion: string): Promise<string[]> {
        const containerClient = await this.getFormatVersionsContainerClient();
        const blobClient = containerClient.getBlockBlobClient(formatVersion);
        if (!(await blobClient.exists())) {
            throw new NotFoundError(`Format version ${formatVersion} does not exist`);
        }
        const downloadBlockBlobResponse = await blobClient.download(0);
        const downloadedContent = await this.streamToString(downloadBlockBlobResponse.readableStreamBody as Readable);
        return JSON.parse(downloadedContent);
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
            const data = Buffer.from(JSON.stringify(Array.from(formatVersionsWithPruefis[formatVersion])));
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
            const formatVersion = blob.name.split("/")[0];
            if (!formatVersionBlobStorage[formatVersion]) {
                formatVersionBlobStorage[formatVersion] = new Set();
            }
            const pruefi = blob.name.split("/")[3].split(".")[0];
            formatVersionBlobStorage[formatVersion].add(pruefi);
        }
        return formatVersionBlobStorage;
    }
}