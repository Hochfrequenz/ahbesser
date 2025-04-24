#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Checking if database needs to be decrypted..."

ARCHIVE_PATH="/service/src/server/data/ahb.db.encrypted.7z"
DB_PATH="/service/src/server/data/ahb.db"

if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "Error: 7z archive not found at $ARCHIVE_PATH"
    exit 1
fi

# Only decrypt if the database doesn't exist or if the archive is newer
if [ ! -f "$DB_PATH" ] || [ "$ARCHIVE_PATH" -nt "$DB_PATH" ]; then
    echo "Decrypting database from 7z archive..."
    if [ -z "$DB_7Z_ARCHIVE_PASSWORD" ]; then
        echo "Error: DB_7Z_ARCHIVE_PASSWORD environment variable is not set"
        exit 1
    fi

    7z x -p"$DB_7Z_ARCHIVE_PASSWORD" -o"$(dirname "$DB_PATH")" "$ARCHIVE_PATH"

    if [ $? -eq 0 ]; then
        echo "Database decrypted successfully"
    else
        echo "Error: Failed to decrypt database"
        exit 1
    fi
else
    echo "Database is up to date, no decryption needed"
fi
