#!/usr/bin/env node

/**
 * OpenFoodFacts to MongoDB Atlas Vector Database Upload Script
 * 
 * This script processes the OpenFoodFacts MongoDB dump and uploads it to 
 * MongoDB Atlas with vector embeddings for AI-powered search capabilities.
 */

const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');
const fs = require('fs');
const { spawn } = require('child_process');

// Configuration
const config = {
  // Source: Local OpenFoodFacts dump
  sourceDumpPath: './datadumps/openfoodfacts-mongodbdump',
  
  // Target: MongoDB Atlas with vector search
  atlasUri: process.env.MONGODB_URI,
  atlasDatabase: 'smarties_prod',
  atlasCollection: 'products',
  
  // AI Service for embeddings
  openaiApiKey: process.env.OPENAI_API_KEY,
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  
  // Processing settings
  batchSize: 100,
  maxProducts: process.env.MAX_PRODUCTS || 50000, // Limit for testing
};

class OpenFoodFactsUploader {
  constructor() {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.atlasClient = null;
    this.collection = null;
    this.processedCount = 0;
  }

  async connect() {
    console.log('Connecting to MongoDB Atlas...');
    this.atlasClient = new MongoClient(config.atlasUri);
    await this.atlasClient.connect();
    this.collection = this.atlasClient.db(config.atlasDatabase).collection(config.atlasCollection);
    console.log('Connected to MongoDB Atlas');
  }

  async createVectorIndexes() {
    console.log('Creating vector search indexes...');
    
    const vectorIndexes = [
      {
        name: 'ingredients_vector_index',
        definition: {
          fields: [{
            type: 'vector',
            path: 'ingredients_embedding',
            numDimensions: config.embeddingDimensions,
            similarity: 'cosine'
          }]
        }
      },
      {
        name: 'product_name_vector_index', 
        definition: {
          fields: [{
            type: 'vector',
            path: 'product_name_embedding',
            numDimensions: config.embeddingDimensions,
            similarity: 'cosine'
          }]
        }
      },
      {
        name: 'allergens_vector_index',
        definition: {
          fields: [{
            type: 'vector',
            path: 'allergens_embedding',
            numDimensions: config.embeddingDimensions,
            similarity: 'cosine'
          }]
        }
      }
    ];

    // Note: Vector indexes must be created via Atlas UI or Atlas CLI
    console.log('Vector indexes configuration:', JSON.stringify(vectorIndexes, null, 2));
    console.log('Please create these indexes in MongoDB Atlas Vector Search');
  }

  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) return null;
    
    try {
      const response = await this.openai.embeddings.create({
        model: config.embeddingModel,
        input: text.substring(0, 8000), // Limit text length
        dimensions: config.embeddingDimensions
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error.message);
      return null;
    }
  }

  async processProduct(product) {
    // Extract key fields
    const code = product.code;
    const productName = product.product_name || '';
    const ingredientsText = product.ingredients_text || '';
    const allergensText = (product.allergens_tags || []).join(', ');

    // Generate embeddings
    const [ingredientsEmbedding, productNameEmbedding, allergensEmbedding] = await Promise.all([
      this.generateEmbedding(ingredientsText),
      this.generateEmbedding(productName),
      this.generateEmbedding(allergensText)
    ]);

    // Create enhanced product document
    return {
      // Original OpenFoodFacts data
      code,
      product_name: productName,
      brands_tags: product.brands_tags || [],
      categories_tags: product.categories_tags || [],
      ingredients_text: ingredientsText,
      allergens_tags: product.allergens_tags || [],
      traces_tags: product.traces_tags || [],
      labels_tags: product.labels_tags || [],
      ingredients_analysis_tags: product.ingredients_analysis_tags || [],
      nutrition_grades_tags: product.nutrition_grades_tags || [],
      
      // Vector embeddings for AI search
      ingredients_embedding: ingredientsEmbedding,
      product_name_embedding: productNameEmbedding,
      allergens_embedding: allergensEmbedding,
      
      // Derived dietary flags
      dietary_flags: this.deriveDietaryFlags(product),
      
      // Metadata
      imported_at: new Date(),
      source: 'openfoodfacts',
      has_embeddings: !!(ingredientsEmbedding || productNameEmbedding || allergensEmbedding)
    };
  }

  deriveDietaryFlags(product) {
    const analysisFlags = product.ingredients_analysis_tags || [];
    const labelFlags = product.labels_tags || [];
    
    return {
      vegan: analysisFlags.includes('en:vegan'),
      vegetarian: analysisFlags.includes('en:vegetarian') || analysisFlags.includes('en:vegan'),
      gluten_free: labelFlags.some(label => label.includes('gluten-free')),
      kosher: labelFlags.some(label => label.includes('kosher')),
      halal: labelFlags.some(label => label.includes('halal')),
      organic: labelFlags.some(label => label.includes('organic'))
    };
  }

  async restoreAndProcess() {
    console.log('Starting OpenFoodFacts data upload...');
    
    // Step 1: Restore MongoDB dump to temporary local instance
    console.log('Restoring MongoDB dump...');
    await this.restoreDump();
    
    // Step 2: Connect to local MongoDB to read data
    const localClient = new MongoClient('mongodb://localhost:27017');
    await localClient.connect();
    const sourceCollection = localClient.db('off').collection('products');
    
    // Step 3: Process products in batches
    const cursor = sourceCollection.find({
      code: { $exists: true, $ne: '' },
      product_name: { $exists: true, $ne: '' }
    }).limit(config.maxProducts);
    
    let batch = [];
    
    for await (const product of cursor) {
      const processedProduct = await this.processProduct(product);
      batch.push(processedProduct);
      
      if (batch.length >= config.batchSize) {
        await this.uploadBatch(batch);
        batch = [];
      }
      
      this.processedCount++;
      if (this.processedCount % 1000 === 0) {
        console.log(`Processed ${this.processedCount} products...`);
      }
    }
    
    // Upload remaining products
    if (batch.length > 0) {
      await this.uploadBatch(batch);
    }
    
    await localClient.close();
    console.log(`Upload complete! Processed ${this.processedCount} products.`);
  }

  async restoreDump() {
    return new Promise((resolve, reject) => {
      const mongorestore = spawn('mongorestore', [
        '--host', 'localhost:27017',
        '--archive=' + config.sourceDumpPath,
        '--gzip'
      ]);
      
      mongorestore.on('close', (code) => {
        if (code === 0) {
          console.log('MongoDB dump restored successfully');
          resolve();
        } else {
          reject(new Error(`mongorestore failed with code ${code}`));
        }
      });
    });
  }

  async uploadBatch(products) {
    try {
      const result = await this.collection.insertMany(products, { ordered: false });
      console.log(`Uploaded batch of ${result.insertedCount} products`);
    } catch (error) {
      console.error('Error uploading batch:', error.message);
    }
  }

  async createIndexes() {
    console.log('Creating standard indexes...');
    
    await Promise.all([
      this.collection.createIndex({ code: 1 }, { unique: true }),
      this.collection.createIndex({ 'allergens_tags': 1 }),
      this.collection.createIndex({ 'dietary_flags.vegan': 1 }),
      this.collection.createIndex({ 'dietary_flags.gluten_free': 1 }),
      this.collection.createIndex({ 'categories_tags': 1 }),
      this.collection.createIndex({ 'has_embeddings': 1 })
    ]);
    
    console.log('Standard indexes created');
  }

  async close() {
    if (this.atlasClient) {
      await this.atlasClient.close();
    }
  }
}

// Main execution
async function main() {
  const uploader = new OpenFoodFactsUploader();
  
  try {
    await uploader.connect();
    await uploader.createVectorIndexes();
    await uploader.restoreAndProcess();
    await uploader.createIndexes();
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  } finally {
    await uploader.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { OpenFoodFactsUploader };
