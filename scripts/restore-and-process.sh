#!/bin/bash

# Script to restore MongoDB dump and process top 1000 products with embeddings

echo "🔄 Restoring MongoDB dump to temporary database..."

# Restore the dump to a temporary database
mongorestore --uri="$MONGODB_URI" --db=temp_openfoodfacts --drop /mnt/c/git/SMARTIES/datadumps/openfoodfacts-mongodbdump

echo "✅ Dump restored to temp_openfoodfacts database"

echo "🔄 Running product processing script..."

# Run the TypeScript processing script
npx ts-node scripts/process-restored-data.ts

echo "🧹 Cleaning up temporary database..."

# Clean up temporary database
mongo "$MONGODB_URI" --eval "db.getSiblingDB('temp_openfoodfacts').dropDatabase()"

echo "✅ Processing complete!"
