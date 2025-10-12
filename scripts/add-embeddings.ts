import { MongoClient } from 'mongodb';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

async function generateEmbedding(text: string): Promise<number[]> {
  if (!text?.trim()) return new Array(384).fill(0);
  
  // Clean text for Python
  const cleanText = text.replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\r/g, ' ').substring(0, 500);
  
  return new Promise((resolve, reject) => {
    const python = spawn('/mnt/c/git/SMARTIES/venv/Scripts/python.exe', ['-c', `
import sys
sys.path.append('/mnt/c/git/SMARTIES')
from embedding_service import EmbeddingService
service = EmbeddingService()
result = service.generate_embedding("${cleanText}")
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

async function addEmbeddings() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db('smarties_db');
    const collection = db.collection('products_real');
    
    const products = await collection.find({}).toArray();
    console.log(`Adding embeddings to ${products.length} products...`);
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`${i + 1}/${products.length}: ${product.product_name}`);
      
      const ingredients_embedding = await generateEmbedding(product.ingredients_text);
      const product_name_embedding = await generateEmbedding(product.product_name);
      const allergens_embedding = await generateEmbedding(product.allergens || '');
      
      await collection.updateOne(
        { _id: product._id },
        { 
          $set: { 
            ingredients_embedding,
            product_name_embedding,
            allergens_embedding
          }
        }
      );
    }
    
    console.log('✅ All embeddings added!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

addEmbeddings();
