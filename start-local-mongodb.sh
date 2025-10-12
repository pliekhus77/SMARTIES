#!/bin/bash
# Start local MongoDB with vector search for hackathon

echo "Starting MongoDB with vector search capabilities..."

# Start MongoDB container
docker-compose up -d mongodb

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
sleep 10

# Initialize replica set (required for vector search)
docker exec -it smarties-mongodb-1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [{ _id: 0, host: 'localhost:27017' }]
})
"

# Create database and enable vector search
docker exec -it smarties-mongodb-1 mongosh --eval "
use smarties;
db.createCollection('products');
db.createCollection('users');
db.createCollection('scan_results');

// Create vector search index for products
db.products.createSearchIndex({
  name: 'vector_index',
  definition: {
    fields: [
      {
        type: 'vector',
        path: 'embedding',
        numDimensions: 1536,
        similarity: 'cosine'
      }
    ]
  }
});
"

echo "MongoDB with vector search is ready!"
echo "Connection string: mongodb://admin:password@localhost:27017/smarties?authSource=admin"
