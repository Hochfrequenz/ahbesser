#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting application setup with environment: $ENVIRONMENT"

# Build the Angular application using local Angular CLI
echo "Building Angular application..."
./node_modules/.bin/ng build --configuration=$ENVIRONMENT

# Build the Express server
echo "Building Express server..."
npm run server:build

# switch to non-root user nodejs
su - nodejs

# Start the server
echo "Starting the Express server..."
node dist/server/server.js
