import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { join } from 'path';
import cors from 'cors';
import router from './server/infrastructure/api.routes';
import { httpErrorHandler } from './server/infrastructure/errors';
import { environment } from './app/environments/environment';
import { AppDataSource } from './server/infrastructure/database';
import 'reflect-metadata';

const server = express();
server.use(
  cors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4000',
      'https://ahb-tabellen.stage.hochfrequenz.de',
      'https://ahb-tabellen.hochfrequenz.de',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const distFolder = join(process.cwd(), 'dist/ahbesser/browser');
const indexHtml = 'index.html';

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection initialized');
  })
  .catch(error => {
    console.error('Error initializing database connection:', error);
  });

server.get('/version', (_, res) =>
  res.send({
    buildDate: process.env['BUILD_DATE'] || 'unknown',
    commitId: process.env['COMMIT_ID'] || 'unknown',
    version: process.env['VERSION'] || 'unknown',
    environment: process.env['ENVIRONMENT'] || 'unknown (local)',
    name: 'ahb-tabellen',
  })
);
server.get('/health', (_, res) => res.send());
server.get('/readiness', (_, res) => res.send());

server.use('/api', router);

// Apply error handler middleware
server.use(httpErrorHandler);

// Serve static files from /browser
server.get('*.*', express.static(distFolder, { maxAge: '1y' }));

// All regular routes serve angular
server.get('*', async (_, res) => res.sendFile(join(distFolder, indexHtml)));

const port = process.env['PORT'] || 3000;
server.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});
