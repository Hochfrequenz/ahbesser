# BUILDER IMAGE
FROM node:23.5-alpine AS builder

WORKDIR /service

COPY . .

RUN npm ci --no-scripts

RUN npm run ng:build
RUN npm run server:build

# PRODUCTION IMAGE
FROM node:23.5-alpine

# Set build arguments
ARG BUILD_DATE
ARG COMMIT_ID
ARG VERSION

# Set environment variables
ENV BUILD_DATE=$BUILD_DATE
ENV COMMIT_ID=$COMMIT_ID
ENV VERSION=$VERSION

WORKDIR /service

RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nodejs

COPY --chown=nodejs:nodejs --from=builder /service/dist dist
COPY --chown=nodejs:nodejs --from=builder /service/node_modules node_modules

USER nodejs

EXPOSE 3000

CMD node dist/server/server.js
