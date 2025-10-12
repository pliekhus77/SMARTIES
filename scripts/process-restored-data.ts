import { MongoClient } from 'mongodb';
import OpenAI from 'openai';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-connection-string';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  if (!text?.trim()) return new Array(384).fill(0);
  
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.substring(0, 8000),
  });
  
  return response.data[0].embedding;
}

async function processRestoredData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    
    const tempDb = client.db('temp_openfoodfacts');
    const targetDb = client.db('smarties');
    const targetCollection = targetDb.collection('products');
    
    console.log('🔍 Finding top 1000 products by scan count...');
    
    // Get collection name from temp database
    const collections = await tempDb.listCollections().toArray();
    const collectionName = collections[0]?.name || 'products';
    const sourceCollection = tempDb.collection(collectionName);
    
    // Find top 1000 products by unique_scans_n
    const topProducts = await sourceCollection
      .find({
        code: { $exists: true, $ne: null },
        product_name: { $exists: true, $ne: null },
        ingredients_text: { $exists: true, $ne: null },
        unique_scans_n: { $gt: 0 }
      })
      .sort({ unique_scans_n: -1 })
      .limit(1000)
      .toArray();
    
    console.log(`📦 Found ${topProducts.length} products to process`);
    
    const processedProducts = [];
    
    for (let i = 0; i < topProducts.length; i++) {
      const raw = topProducts[i];
      
      console.log(`⚡ Processing ${i + 1}/${topProducts.length}: ${raw.product_name}`);
      
      const product: any = {
        _id: raw.code,
        product_name: raw.product_name || '',
        ingredients_text: raw.ingredients_text || '',
        allergens: raw.allergens || '',
        unique_scans_n: raw.unique_scans_n || 0,
        categories: raw.categories || '',
        brands: raw.brands || '',
        countries: raw.countries || ''
      };
      
      try {
        product.ingredients_embedding = await generateEmbedding(product.ingredients_text);
        product.product_name_embedding = await generateEmbedding(product.product_name);
        product.allergens_embedding = await generateEmbedding(product.allergens);
        
        processedProducts.push(product);
        
        // Batch insert every 25 products
        if (processedProducts.length === 25) {
          await targetCollection.insertMany(processedProducts, { ordered: false });
          console.log(`💾 Inserted batch of ${processedProducts.length} products`);
          processedProducts.length = 0;
        }
        
        // Rate limit for OpenAI API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Error processing ${raw.product_name}:`, error);
      }
    }
    
    // Insert remaining products
    if (processedProducts.length > 0) {
      await targetCollection.insertMany(processedProducts, { ordered: false });
      console.log(`💾 Inserted final batch of ${processedProducts.length} products`);
    }
    
    console.log('✅ Top 1000 products loaded with vector embeddings!');
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
  } finally {
    await client.close();
  }
}

processRestoredData();
