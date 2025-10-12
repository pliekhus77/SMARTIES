import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

async function loadRealDataFast() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db('smarties_db');
    const collection = db.collection('products_real');
    
    console.log('🗑️ Clearing existing data...');
    await collection.deleteMany({});
    
    const products = JSON.parse(fs.readFileSync('/mnt/c/git/SMARTIES/top-500-english.json', 'utf8'));
    
    console.log(`⚡ Loading ${products.length} real products...`);
    
    const docs = products.map((product: any) => ({
      _id: product.code,
      product_name: product.product_name,
      ingredients_text: product.ingredients_text,
      allergens: product.allergens || '',
      categories: product.categories || '',
      brands: product.brands || '',
      unique_scans_n: product.unique_scans_n || 0
    }));
    
    await collection.insertMany(docs, { ordered: false });
    
    console.log(`✅ Loaded ${docs.length} real products!`);
    console.log(`Most popular: ${products[0].product_name} (${products[0].unique_scans_n} scans)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

loadRealDataFast();
