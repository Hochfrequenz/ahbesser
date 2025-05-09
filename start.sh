#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting application setup with environment: $ENVIRONMENT"

# Decrypt the database if needed
echo "Checking and decrypting database if needed..."
sh ./decrypt-db.sh

# Build the Angular application using local Angular CLI
echo "Building Angular application with the command 'npm run ng:build --configuration=$ENVIRONMENT'..."
npm run ng:build -- --configuration=$ENVIRONMENT

# Build the Express server
echo "Building Express server..."
npm run server:build

# Start the server
node dist/server/server.js
