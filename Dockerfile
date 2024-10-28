# BUILDER IMAGE
FROM node:23.1-alpine as builder

WORKDIR /service

COPY . .

RUN npm ci --no-scripts

RUN npm run ng:build
RUN npm run server:build

# PRODUCTION IMAGE
FROM node:23.1-alpine

WORKDIR /service

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --chown=nodejs:nodejs --from=builder /service/dist dist
COPY --chown=nodejs:nodejs --from=builder /service/node_modules node_modules

USER nodejs

EXPOSE 3000

CMD node dist/server/server.js