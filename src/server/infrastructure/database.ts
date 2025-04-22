import { DataSource } from 'typeorm';
import { AhbMetaInformation } from '../entities/ahb-meta-information.entity';
import { AhbLine } from '../entities/ahb-line.entity';
import path from 'path';
import fernet from 'fernet';
import fs from 'fs';

const fernetKey = process.env['FERNET_KEY'];
if (!fernetKey) {
  throw new Error('FERNET_KEY environment variable is required');
}

const encryptedDbPath = path.resolve(process.cwd(), 'src/server/data/fernet_encrypted_ahb.db');
const decryptedDbPath = path.resolve(process.cwd(), 'src/server/data/ahb.db');

// Decrypt the database if it doesn't exist or if the encrypted version is newer
if (
  !fs.existsSync(decryptedDbPath) ||
  fs.statSync(encryptedDbPath).mtime > fs.statSync(decryptedDbPath).mtime
) {
  const encryptedData = fs.readFileSync(encryptedDbPath);
  const secret = new fernet.Secret(fernetKey);
  const token = new fernet.Token({
    secret: secret,
    token: encryptedData.toString('base64'),
    ttl: 0,
  });
  const decryptedData = token.decode();
  fs.writeFileSync(decryptedDbPath, decryptedData);
}

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: decryptedDbPath,
  entities: [AhbMetaInformation, AhbLine],
  logging: true, // Enable SQL query logging
  synchronize: false, // Set to false since we already have the database schema
});
