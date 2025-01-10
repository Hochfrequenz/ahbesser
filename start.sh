#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting application setup..."

# Build the Angular application
echo "Building Angular application..."
npm run ng:build --configuration=$ENVIRONMENT

# Build the Express server
echo "Building Express server..."
npm run server:build

# Start the server
echo "Starting the Express server..."
node dist/server/server.js
