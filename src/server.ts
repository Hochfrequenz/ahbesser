// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
require('dotenv').config();

import express from 'express';
import { join } from 'path';
import cors from 'cors';
import router from './server/infrastructure/api.routes';
import { httpErrorHandler } from './server/infrastructure/errors';
import { environment } from './app/environments/environment';

const server = express();
if (process.env['ENABLE_CORS'] === 'true') {
  server.use(cors());
}

const distFolder = join(process.cwd(), 'dist/ahbesser/browser');
const indexHtml = 'index.html';

server.get('/version', (_, res) =>
  res.send({
    buildDate: process.env['BUILD_DATE'] || 'unknown',
    commitId: process.env['COMMIT_ID'] || 'unknown',
    version: process.env['VERSION'] || 'unknown',
    environment: process.env['ENVIRONMENT'] || 'unknown (local)',
    name: 'ahb-tabellen',
    auth0ClientId: environment.auth0ClientId,
  })
);
server.get('/health', (_, res) => res.send());
server.get('/readiness', (_, res) => res.send());

server.use('/api', router);

// Serve static files from /browser
server.get('*.*', express.static(distFolder, { maxAge: '1y' }));

// All regular routes serve angular
server.get('*', async (_, res) => res.sendFile(join(distFolder, indexHtml)));

// Apply error handler middleware
server.use(httpErrorHandler);

const port = process.env['PORT'] || 3000;
server.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});
