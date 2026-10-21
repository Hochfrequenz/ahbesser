import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { join } from 'path';
import cors from 'cors';
import router from './server/infrastructure/api.routes';
import { httpErrorHandler } from './server/infrastructure/errors';
import { AppDataSource } from './server/infrastructure/database';
import { requireApiAuth } from './server/infrastructure/api-auth';
import { mountMcp } from './server/mcp/http';
import {
  buildRuntimeConfig,
  CONFIG_SCRIPT_PATH,
  renderConfigScript,
} from './server/infrastructure/app-config';
import 'reflect-metadata';

const server = express();
server.use(express.json());
server.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:4200',
      'http://localhost:4000',
      'https://ahb-tabellen.stage.hochfrequenz.de',
      'https://ahb-tabellen.hochfrequenz.de',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const distFolder = join(process.cwd(), 'dist/ahb-tabellen/browser');
const indexHtml = 'index.html';

// Built once, at startup, so a malformed APP_* variable fails the process immediately rather
// than the first request that happens to need it.
const configScript = renderConfigScript(buildRuntimeConfig());

// Initialize database connection.
//
// Fatal on failure, deliberately. The database is no longer decrypted from inside the image by a
// `set -e` shell script that took the container down with it — it is a volume seeded by a separate
// job, so a wrong AHB_DB_PATH, an unmounted volume or an unseeded one are all now reachable. Every
// one of them used to be impossible; logging and carrying on would turn each into a container that
// reports healthy while failing 100% of API requests.
let databaseReady = false;
AppDataSource.initialize()
  .then(() => {
    databaseReady = true;
    console.log('Database connection initialized');
  })
  .catch(error => {
    console.error('Error initializing database connection:', error);
    process.exit(1);
  });

server.get('/version', (_, res) =>
  res.send({
    version: process.env['VERSION'] || 'unknown',
    buildDate: process.env['BUILD_DATE'] || 'unknown',
    commitHash: process.env['COMMIT_HASH'] || 'unknown',
    commitDate: process.env['COMMIT_DATE'] || 'unknown',
    buildBranch: process.env['BUILD_BRANCH'] || 'unknown',
    environment: process.env['ENVIRONMENT'] || 'unknown (local)',
    name: 'ahb-tabellen',
  })
);
// Liveness: the process is up and serving. Says nothing about the database.
server.get('/health', (_, res) => res.send());
// Readiness: the database is open and queryable, so this instance can actually serve the API.
// This is what the image's HEALTHCHECK and the compose stacks probe.
server.get('/readiness', (_, res) =>
  databaseReady ? res.send() : res.status(503).send({ status: 'database not ready' })
);

// Every /api route requires a valid Auth0 / Entra access token, except the few public paths
// listed in api-auth.ts. The root probe routes above (/version, /health, /readiness) are
// registered before this and stay open.
server.use('/api', requireApiAuth(), router);

// Mount the MCP server (Streamable HTTP) + its OAuth metadata. MUST be registered before
// the static/catch-all routes below so /mcp and /.well-known are not shadowed by the SPA.
mountMcp(server);

// Apply error handler middleware
server.use(httpErrorHandler);

// Runtime configuration for the Angular bundle, which loads it from index.html before starting.
// MUST be registered before the static handler below, whose `*file.*ext` pattern would otherwise
// match this path and 404 it. Never cached: a configuration change must take effect on restart.
server.get(CONFIG_SCRIPT_PATH, (_, res) =>
  res.type('application/javascript').set('Cache-Control', 'no-store').send(configScript)
);

// Serve static files from /browser
server.get('*file.*ext', express.static(distFolder, { maxAge: '1y' }));

// All regular routes serve angular
server.get('{/*splat}', async (_, res) => res.sendFile(join(distFolder, indexHtml)));

const port = process.env['PORT'] || 3000;
const httpServer = server.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});

// Node as PID 1 gets no default signal handlers, so without this `docker stop` waits out its
// full grace period and then SIGKILLs the container on every deploy. Stop accepting connections,
// drop idle keep-alives, close the database, then exit.
const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`Received ${signal}, shutting down`);
  // Stop reporting ready first: this instance is about to stop serving, and the probe should say
  // so for the whole of the drain rather than only once the process is gone.
  databaseReady = false;
  httpServer.close(() => {
    const closed = AppDataSource.isInitialized ? AppDataSource.destroy() : Promise.resolve();
    void closed.finally(() => process.exit(0));
  });
  httpServer.closeIdleConnections();
  // Safety net: one long-lived request must not keep the container alive indefinitely.
  setTimeout(() => process.exit(0), 10_000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
