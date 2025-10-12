#!/usr/bin/env node

/**
 * Analyze OpenFoodFacts record sizes for top 1000 products
 */

const { MongoClient } = require('mongodb');
const { spawn } = require('child_process');

async function analyzeRecordSizes() {
  console.log('Analyzing top 1000 OpenFoodFacts records...');
  
  // Step 1: Restore dump if needed
  console.log('Restoring MongoDB dump...');
  await restoreDump();
  
  // Step 2: Connect and analyze
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const collection = client.db('off').collection('products');
  
  // Get top 1000 products by popularity
  const cursor = collection.find({
    code: { $exists: true, $ne: '' },
    product_name: { $exists: true, $ne: '' },
    $or: [
      { unique_scans_n: { $exists: true, $gt: 0 } },
      { popularity_key: { $exists: true } }
    ]
  })
  .sort({ 
    unique_scans_n: -1,
    popularity_key: -1,
    last_modified_t: -1
  })
  .limit(1000);
  
  let totalSize = 0;
  let count = 0;
  let maxSize = 0;
  let minSize = Infinity;
  const sampleSizes = [];
  
  for await (const product of cursor) {
    const jsonString = JSON.stringify(product);
    const size = Buffer.byteLength(jsonString, 'utf8');
    
    totalSize += size;
    count++;
    maxSize = Math.max(maxSize, size);
    minSize = Math.min(minSize, size);
    sampleSizes.push(size);
    
    if (count <= 10) {
      console.log(`Record ${count}: ${formatBytes(size)} - ${product.product_name?.substring(0, 50) || 'N/A'}`);
    }
  }
  
  // Calculate statistics
  const avgSize = totalSize / count;
  const medianSize = sampleSizes.sort((a, b) => a - b)[Math.floor(count / 2)];
  
  console.log('\n📊 Size Analysis Results:');
  console.log(`Records analyzed: ${count}`);
  console.log(`Total size: ${formatBytes(totalSize)}`);
  console.log(`Average size per record: ${formatBytes(avgSize)}`);
  console.log(`Median size per record: ${formatBytes(medianSize)}`);
  console.log(`Largest record: ${formatBytes(maxSize)}`);
  console.log(`Smallest record: ${formatBytes(minSize)}`);
  
  // Estimate with embeddings
  const embeddingSize = 1536 * 4 * 3; // 3 embeddings, 4 bytes per float
  const avgSizeWithEmbeddings = avgSize + embeddingSize;
  const totalSizeWithEmbeddings = totalSize + (embeddingSize * count);
  
  console.log('\n🤖 With Vector Embeddings:');
  console.log(`Embedding overhead per record: ${formatBytes(embeddingSize)}`);
  console.log(`Average size with embeddings: ${formatBytes(avgSizeWithEmbeddings)}`);
  console.log(`Total size with embeddings: ${formatBytes(totalSizeWithEmbeddings)}`);
  
  // Scaling estimates
  console.log('\n📈 Scaling Estimates:');
  console.log(`1K records: ${formatBytes(totalSizeWithEmbeddings)}`);
  console.log(`10K records: ${formatBytes(totalSizeWithEmbeddings * 10)}`);
  console.log(`100K records: ${formatBytes(totalSizeWithEmbeddings * 100)}`);
  
  await client.close();
}

async function restoreDump() {
  return new Promise((resolve, reject) => {
    const mongorestore = spawn('mongorestore', [
      '--host', 'localhost:27017',
      '--archive=./datadumps/openfoodfacts-mongodbdump',
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

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

if (require.main === module) {
  analyzeRecordSizes().catch(console.error);
}
