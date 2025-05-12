# Single-Stage Dockerfile
FROM node:24.0-alpine

# Set environment arguments and variables
ARG BUILD_DATE
ARG COMMIT_ID
ARG VERSION

# Environment variables
ENV BUILD_DATE=$BUILD_DATE \
  COMMIT_ID=$COMMIT_ID \
  VERSION=$VERSION

WORKDIR /service

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nodejs

# Copy package files first for better caching
COPY package*.json ./
COPY tailwind.config.js ./

# Install dependencies
RUN npm ci --no-scripts

# Copy the rest of the application
COPY . .

# Install p7zip for 7z archive handling
RUN apk add --no-cache p7zip

# Make scripts executable
RUN chmod +x ./start.sh ./decrypt-db.sh

# Change ownership of the service folder and all copied files to the nodejs user
RUN chown -R nodejs:nodejs /service

# Switch to non-root user
USER nodejs

# Expose port for the server
EXPOSE 3000

# Start the application via start.sh script
CMD ["sh", "./start.sh"]