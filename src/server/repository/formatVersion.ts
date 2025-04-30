import { NotFoundError } from '../infrastructure/errors';
import { AppDataSource } from '../infrastructure/database';
import { AhbLine, Anwendungshandbuch } from '../entities/ahb-line.entity';

interface FormatVersionsWithPruefis {
  [formatVersion: string]: Set<string>;
}

interface PruefiWithName {
  pruefidentifikator: string;
  name: string;
}

// The FormatVersionRepository class is responsible for retrieving the format versions and their related pruefis.
export default class FormatVersionRepository {
  constructor() {}

  // Return a list of all unique format versions from the database
  public async list(): Promise<string[]> {
    // Initialize the database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const formatVersions = await AppDataSource.getRepository(Anwendungshandbuch)
      .createQueryBuilder('ahb')
      .select('DISTINCT ahb.edifact_format_version', 'formatVersion')
      .orderBy('ahb.edifact_format_version')
      .getRawMany();

    return formatVersions.map(result => result.formatVersion);
  }

  // Return a list of all pruefis for a specific format version by looking at the json files
  // in the flatahb directory of the format version
  public async listPruefisByFormatVersion(formatVersion: string): Promise<PruefiWithName[]> {
    // Initialize the database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const pruefis = await AppDataSource.getRepository(AhbLine)
      .createQueryBuilder('ahb')
      .select('DISTINCT ahb.pruefidentifikator, ahb.description')
      .where('ahb.format_version = :formatVersion', { formatVersion })
      .orderBy('ahb.pruefidentifikator')
      .getRawMany();

    if (pruefis.length === 0) {
      throw new NotFoundError(`Format version ${formatVersion} does not exist`);
    }

    return pruefis.map(pruefi => ({
      pruefidentifikator: pruefi.pruefidentifikator,
      name: pruefi.description || '',
    }));
  }

  private async getFormatVersionsContainerClient(): Promise<void> {
    throw new Error('Blob storage functionality has been removed');
  }

  private async createFormatVersionContainer(): Promise<void> {
    throw new Error('Blob storage functionality has been removed');
  }

  private async buildFormatVersionsWithPruefis(): Promise<FormatVersionsWithPruefis> {
    throw new Error('Blob storage functionality has been removed');
  }
}
