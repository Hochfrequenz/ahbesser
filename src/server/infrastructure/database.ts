import { DataSource } from 'typeorm';
import { AhbMetaInformation } from '../entities/ahb-meta-information.entity';
import { AhbLine } from '../entities/ahb-line.entity';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'src/server/data/ahb.db');
console.log('Database path:', dbPath);

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  entities: [AhbMetaInformation, AhbLine],
  logging: true, // Enable SQL query logging
  synchronize: false, // Set to false since we already have the database schema
});
