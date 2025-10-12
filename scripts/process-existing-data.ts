import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as readline from 'readline';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

interface Product {
  _id: string;
  product_name: string;
  ingredients_text: string;
  allergens: string;
  unique_scans_n?: number;
  ingredients_embedding?: number[];
  product_name_embedding?: number[];
  allergens_embedding?: number[];
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (!text?.trim()) return new Array(384).fill(0);
  
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['-c', `
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
        reject(new Error(`Python process failed with code ${code}`));
      }
    });
  });
}

async function processDataDump() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('smarties');
    const collection = db.collection('products');
    
    console.log('Reading OpenFoodFacts dump...');
    
    const fileStream = fs.createReadStream('/mnt/c/git/SMARTIES/datadumps/openfoodfacts-mongodbdump');
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    const products: any[] = [];
    let lineCount = 0;
    
    for await (const line of rl) {
      if (!line.trim()) continue;
      
      try {
        const product = JSON.parse(line);
        
        if (product.code && 
            product.product_name && 
            product.ingredients_text &&
            product.unique_scans_n > 0) {
          products.push(product);
        }
        
        lineCount++;
        if (lineCount % 10000 === 0) {
          console.log(`Processed ${lineCount} lines, found ${products.length} valid products`);
        }
        
      } catch (error) {
        continue;
      }
    }
    
    console.log(`Found ${products.length} valid products`);
    
    products.sort((a, b) => (b.unique_scans_n || 0) - (a.unique_scans_n || 0));
    const top1000 = products.slice(0, 1000);
    
    console.log('Processing top 1000 products with HuggingFace embeddings...');
    
    const processedProducts: Product[] = [];
    
    for (let i = 0; i < top1000.length; i++) {
      const raw = top1000[i];
      
      console.log(`Processing ${i + 1}/1000: ${raw.product_name}`);
      
      const product: Product = {
        _id: raw.code,
        product_name: raw.product_name || '',
        ingredients_text: raw.ingredients_text || '',
        allergens: raw.allergens || '',
        unique_scans_n: raw.unique_scans_n || 0
      };
      
      try {
        product.ingredients_embedding = await generateEmbedding(product.ingredients_text);
        product.product_name_embedding = await generateEmbedding(product.product_name);
        product.allergens_embedding = await generateEmbedding(product.allergens);
        
        processedProducts.push(product);
        
        if (processedProducts.length === 50) {
          await collection.insertMany(processedProducts as any[], { ordered: false });
          console.log(`Inserted batch of ${processedProducts.length} products`);
          processedProducts.length = 0;
        }
        
      } catch (error) {
        console.error(`Error processing ${raw.product_name}:`, error);
      }
    }
    
    if (processedProducts.length > 0) {
      await collection.insertMany(processedProducts as any[], { ordered: false });
      console.log(`Inserted final batch of ${processedProducts.length} products`);
    }
    
    console.log('✅ Top 1000 products loaded successfully!');
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
  } finally {
    await client.close();
  }
}

processDataDump();
