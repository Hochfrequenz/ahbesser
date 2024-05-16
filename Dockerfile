FROM node:20.13-alpine

WORKDIR /service

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --chown=nodejs:nodejs . .

RUN rm -rf azure-mock/

# install
RUN npm ci --no-scripts

# build
RUN npm run ng:build
RUN npm run server:build

# use non root user
USER nodejs

# default port
EXPOSE 3000

CMD node dist/server/server.js