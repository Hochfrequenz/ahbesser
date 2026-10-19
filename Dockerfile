# Multi-stage build: everything is compiled here, so the container start is just `node`.
#
# The image deliberately contains no database. The ~1.1 GB SQLite file is delivered separately
# as a versioned data image and seeded into a volume the container mounts read-only at /data
# (AHB_DB_PATH). See the "Update the database" section of the README.
#
# Each stage repeats the `node:` tag literally rather than sharing an ARG, so Dependabot keeps
# recognising and bumping them.

# --- dependencies -------------------------------------------------------------------------
# Separate from the build stage so a source-only change does not reinstall node_modules.
FROM node:26.12-alpine AS deps
WORKDIR /service
COPY package.json package-lock.json ./
RUN npm ci

# --- build --------------------------------------------------------------------------------
# Compiles the Angular bundle and the Express server. This used to happen at container start,
# which cost minutes of downtime per restart and forced a 2 GB memory ceiling on the runtime
# container (an Angular production build is OOM-killed below roughly 1.5 GB).
#
# Only the `production` configuration is built: one image serves every environment, configured
# at runtime through /config.js. See src/server/infrastructure/app-config.ts.
FROM node:26.12-alpine AS build
WORKDIR /service
COPY --from=deps /service/node_modules ./node_modules
COPY package.json package-lock.json angular.json tailwind.config.js postcss.config.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.server.json ./
COPY src ./src
RUN npm run ng:build -- --configuration=production \
  && npm run server:build

# --- production dependencies ---------------------------------------------------------------
# Pruned rather than reinstalled, so the native sqlite3 binding built in `deps` is reused.
FROM node:26.12-alpine AS prod-deps
WORKDIR /service
COPY --from=deps /service/node_modules ./node_modules
COPY package.json package-lock.json ./
RUN npm prune --omit=dev

# --- runtime -------------------------------------------------------------------------------
FROM node:26.12-alpine AS runtime

ARG BUILD_DATE
ARG COMMIT_DATE
ARG COMMIT_HASH
ARG BUILD_BRANCH
ARG VERSION

ENV BUILD_DATE=$BUILD_DATE \
  COMMIT_DATE=$COMMIT_DATE \
  COMMIT_HASH=$COMMIT_HASH \
  BUILD_BRANCH=$BUILD_BRANCH \
  VERSION=$VERSION \
  NODE_ENV=production

# src/server.ts resolves both the static bundle and the default database path from the working
# directory, so this must stay /service.
WORKDIR /service

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nodejs

# Compiled output only: no sources, no dev dependencies, no build toolchain, no database.
COPY --from=prod-deps --chown=nodejs:nodejs /service/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /service/dist ./dist
COPY --chown=nodejs:nodejs package.json ./

USER nodejs

EXPOSE 3000

# The compose stacks define their own healthcheck; this is the sensible default for anyone
# running the image directly.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/readiness >/dev/null || exit 1

# No entrypoint script: the server handles SIGTERM itself (see src/server.ts).
CMD ["node", "dist/server/server.js"]
