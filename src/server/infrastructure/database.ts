import { DataSource } from 'typeorm';
import { AhbMetaInformation } from '../entities/ahb-meta-information.entity';
import {AhbLine, Anwendungshandbuch} from '../entities/ahb-line.entity';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'src/server/data/ahb.db');

// Create the DataSource configuration
const dataSourceConfig = {
  type: 'sqlite' as const,
  database: dbPath,
  entities: [AhbMetaInformation, AhbLine, Anwendungshandbuch],
  logging: true, // Enable SQL query logging
  synchronize: false, // Set to false since we already have the database schema
};

// Initialize the database connection
export async function initializeDatabase(): Promise<DataSource> {
  const dataSource = new DataSource(dataSourceConfig);
  await dataSource.initialize();
  return dataSource;
}

// Export the DataSource configuration for use in other files
export const AppDataSource = new DataSource(dataSourceConfig);
