import { DataSource } from 'typeorm';
import { AhbMetaInformation } from '../entities/ahb-meta-information.entity';
import { AhbLine } from '../entities/ahb-line.entity';
import path from 'path';
import fs from 'fs';
import Seven from 'node-7z';

// Type declarations for node-7z
declare module 'node-7z' {
  interface SevenOptions {
    password?: string;
    $progress?: boolean;
  }

  interface Seven {
    extractFull: (
      archivePath: string,
      destPath: string,
      options: SevenOptions
    ) => {
      on: (event: 'end' | 'error', callback: (err?: Error) => void) => void;
    };
  }
}

const password = process.env['FERNET_KEY'];
if (!password) {
  throw new Error('FERNET_KEY environment variable is required for 7z archive password');
}

const archivePath = path.resolve(process.cwd(), 'src/server/data/ahb.db.7z');
const dbPath = path.resolve(process.cwd(), 'src/server/data/ahb.db');

// Function to extract 7z archive
async function extractArchive() {
  console.log('Checking if database needs to be extracted...');

  if (!fs.existsSync(archivePath)) {
    throw new Error(`7z archive not found at ${archivePath}`);
  }

  // Only extract if the database doesn't exist or if the archive is newer
  if (!fs.existsSync(dbPath) || fs.statSync(archivePath).mtime > fs.statSync(dbPath).mtime) {
    console.log('Extracting database from 7z archive...');
    try {
      // Using node-7z to extract the archive with password
      const stream = Seven.extractFull(archivePath, path.dirname(dbPath), {
        password: password,
        $progress: true,
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('end', () => {
          console.log('Database extracted successfully');
          resolve();
        });

        stream.on('error', (err?: Error) => {
          console.error('Error extracting database:', err);
          reject(new Error('Failed to extract database from 7z archive'));
        });
      });
    } catch (error) {
      console.error('Error extracting database:', error);
      throw error;
    }
  } else {
    console.log('Database is up to date, no extraction needed');
  }
}

// Create the DataSource configuration
const dataSourceConfig = {
  type: 'sqlite' as const,
  database: dbPath,
  entities: [AhbMetaInformation, AhbLine],
  logging: true, // Enable SQL query logging
  synchronize: false, // Set to false since we already have the database schema
};

// Initialize the database connection
export async function initializeDatabase(): Promise<DataSource> {
  await extractArchive();
  const dataSource = new DataSource(dataSourceConfig);
  await dataSource.initialize();
  return dataSource;
}

// Export the DataSource configuration for use in other files
export const AppDataSource = new DataSource(dataSourceConfig);
