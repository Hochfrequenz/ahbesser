import { Request, Response } from 'express';
import { AppDataSource } from '../infrastructure/database';
import { createNewBlobStorageClient } from '../infrastructure/azure-blob-storage-client';
import { ExternalServiceError } from '../infrastructure/errors';

enum HealthCheckStatus {
  OK = 'ok',
  WARNING = 'warning',
  FAILED = 'failed',
  CRASHED = 'crashed',
  SKIPPED = 'skipped',
}

interface HealthCheckResult {
  name: string;
  label: string;
  notificationMessage: string | null;
  shortSummary: string;
  status: HealthCheckStatus;
  meta?: Record<string, unknown>;
}

interface HealthCheckResponse {
  finishedAt: string;
  checkResults: HealthCheckResult[];
}

export default class HealthController {
  public async check(req: Request, res: Response): Promise<void> {
    // Validate Oh Dear health check secret
    const providedSecret = req.header('oh-dear-health-check-secret');
    const expectedSecret = process.env['OH_DEAR_HEALTH_CHECK_SECRET'];

    if (!expectedSecret) {
      throw new ExternalServiceError('OH_DEAR_HEALTH_CHECK_SECRET environment variable is not set');
    }

    if (providedSecret !== expectedSecret) {
      res.status(401).json({ error: 'Invalid health check secret' });
      return;
    }

    const checkResults: HealthCheckResult[] = [];

    // Check SQLite connection
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      await AppDataSource.query('SELECT 1');

      // Check if tables exist and have data
      const [ahbMetaCount] = await AppDataSource.query(
        'SELECT COUNT(*) as count FROM ahbmetainformation'
      );
      const [ahbLineCount] = await AppDataSource.query('SELECT COUNT(*) as count FROM ahbline');

      checkResults.push({
        name: 'SQLiteConnection',
        label: 'SQLite Database Connection',
        notificationMessage: 'SQLite Database connection successful',
        shortSummary: `Connected - Tables verified`,
        status: HealthCheckStatus.OK,
        meta: {
          ahbMetaCount: ahbMetaCount.count,
          ahbLineCount: ahbLineCount.count,
        },
      });
    } catch (error) {
      checkResults.push({
        name: 'SQLiteConnection',
        label: 'SQLite Database Connection',
        notificationMessage: `Error: Database connection failed: ${(error as Error).message}`,
        shortSummary: 'Failed',
        status: HealthCheckStatus.FAILED,
        meta: { error: (error as Error).message },
      });
    }

    // Check Azure Blob Storage connection
    try {
      const blobClient = createNewBlobStorageClient();
      const containerName = process.env['AHB_CONTAINER_NAME'];

      if (!containerName) {
        throw new Error('AHB_CONTAINER_NAME environment variable is not set');
      }

      const containerClient = blobClient.getContainerClient(containerName);
      await containerClient.getProperties();

      checkResults.push({
        name: 'AzureBlobStorage',
        label: 'Azure Blob Storage Connection',
        notificationMessage: 'Azure Blob Storage connection successful',
        shortSummary: 'Connected',
        status: HealthCheckStatus.OK,
      });
    } catch (error) {
      checkResults.push({
        name: 'AzureBlobStorage',
        label: 'Azure Blob Storage Connection',
        notificationMessage: `Blob storage connection failed: ${(error as Error).message}`,
        shortSummary: 'Failed',
        status: HealthCheckStatus.FAILED,
        meta: { error: (error as Error).message },
      });
    }

    const response: HealthCheckResponse = {
      finishedAt: new Date().toISOString(),
      checkResults,
    };

    // If any check failed, return 500 status
    const hasFailedChecks = checkResults.some(
      check =>
        check.status === HealthCheckStatus.FAILED || check.status === HealthCheckStatus.CRASHED
    );

    res.status(hasFailedChecks ? 500 : 200).json(response);
  }
}
