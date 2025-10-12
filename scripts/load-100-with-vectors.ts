import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

async function generateEmbedding(text: string): Promise<number[]> {
  if (!text?.trim()) return new Array(384).fill(0);
  
  return new Promise((resolve, reject) => {
    const python = spawn('/mnt/c/git/SMARTIES/venv/Scripts/python.exe', ['-c', `
import sys
sys.path.append('/mnt/c/git/SMARTIES')
from embedding_service import EmbeddingService
service = EmbeddingService()
result = service.generate_embedding("${text.replace(/"/g, '\\"').substring(0, 500)}")
print(','.join(map(str, result)))
`]);
    
    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        const embedding = output.trim().split(',').map(Number);
        resolve(embedding);
      } else {
        reject(new Error(`Python failed: ${code}`));
      }
    });
  });
}

async function loadProducts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('smarties_db');
    const collection = db.collection('products');
    
    const products = JSON.parse(fs.readFileSync('/mnt/c/git/SMARTIES/first-100-products.json', 'utf8'));
    
    console.log(`Processing ${products.length} products...`);
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      console.log(`${i + 1}/100: ${product.product_name}`);
      
      const doc = {
        _id: product.code,
        code: product.code,
        product_name: product.product_name,
        ingredients_text: product.ingredients_text,
        allergens: product.allergens || '',
        categories: product.categories || '',
        brands: product.brands || '',
        unique_scans_n: 100 - i, // Mock scan count
        ingredients_embedding: await generateEmbedding(product.ingredients_text),
        product_name_embedding: await generateEmbedding(product.product_name),
        allergens_embedding: await generateEmbedding(product.allergens || '')
      };
      
      try {
        await collection.insertOne(doc);
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicate key, update instead
          await collection.updateOne({ _id: product.code }, { $set: doc });
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ All 100 products loaded with embeddings!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

loadProducts();
