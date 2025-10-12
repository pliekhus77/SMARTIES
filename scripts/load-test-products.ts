import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

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
    python.stdout.on('data', (data) => output += data.toString());
    python.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim().split(',').map(Number));
      } else {
        reject(new Error(`Python failed: ${code}`));
      }
    });
  });
}

async function loadProducts() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db('smarties_db');
    const collection = db.collection('test_products');
    
    const products = JSON.parse(fs.readFileSync('/mnt/c/git/SMARTIES/first-100-products.json', 'utf8'));
    
    console.log(`Processing ${products.length} products...`);
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`${i + 1}/100: ${product.product_name}`);
      
      const doc = {
        _id: product.code,
        product_name: product.product_name,
        ingredients_text: product.ingredients_text,
        allergens: product.allergens || '',
        ingredients_embedding: await generateEmbedding(product.ingredients_text),
        product_name_embedding: await generateEmbedding(product.product_name),
        allergens_embedding: await generateEmbedding(product.allergens || '')
      };
      
      await collection.replaceOne({ _id: product.code }, doc, { upsert: true });
    }
    
    console.log('✅ All 100 products loaded!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

loadProducts();
