#!/bin/bash
# Simple MongoDB setup for hackathon (without vector search)

echo "Setting up simple MongoDB for hackathon..."

# Start MongoDB with Docker
docker run -d \
  --name smarties-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -e MONGO_INITDB_DATABASE=smarties \
  mongo:latest

echo "MongoDB ready at: mongodb://admin:password@localhost:27017/smarties"
echo "For hackathon demo, vector search can be simulated with text search"
