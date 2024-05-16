# This file is used to build the docker image for the azure-mock service
# It is only used for local development and testing purposes
# This file needs a build context of the root of the repository
FROM node:20.13-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-scripts

COPY azure-mock/ ./

ENTRYPOINT ["npx", "tsx", "upload-documents.ts"]

CMD ["data/"]