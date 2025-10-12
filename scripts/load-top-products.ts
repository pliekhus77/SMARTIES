import { MongoClient } from 'mongodb';
import OpenAI from 'openai';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-connection-string';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface Product {
  _id: string;
  product_name: string;
  ingredients_text: string;
  allergens: string;
  nutrition_grades: string;
  categories: string;
  brands: string;
  countries: string;
  ingredients_embedding?: number[];
  product_name_embedding?: number[];
  allergens_embedding?: number[];
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (!text?.trim()) return new Array(384).fill(0);
  
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.substring(0, 8000), // Limit input length
  });
  
  return response.data[0].embedding;
}

async function fetchTopProducts(): Promise<any[]> {
  const response = await fetch(
    'https://world.openfoodfacts.org/cgi/search.pl?' +
    'action=process&tagtype_0=countries&tag_contains_0=contains&tag_0=united-states&' +
    'sort_by=unique_scans_n&page_size=1000&json=1&fields=' +
    'code,product_name,ingredients_text,allergens,nutrition_grades,categories,brands,countries'
  );
  
  const data = await response.json();
  return data.products || [];
}

async function loadProducts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('smarties');
    const collection = db.collection('products');
    
    console.log('Fetching top 1000 products...');
    const rawProducts = await fetchTopProducts();
    
    console.log(`Processing ${rawProducts.length} products...`);
    
    const products: Product[] = [];
    
    for (let i = 0; i < rawProducts.length; i++) {
      const raw = rawProducts[i];
      
      if (!raw.code || !raw.product_name) continue;
      
      console.log(`Processing ${i + 1}/${rawProducts.length}: ${raw.product_name}`);
      
      const product: Product = {
        _id: raw.code,
        product_name: raw.product_name || '',
        ingredients_text: raw.ingredients_text || '',
        allergens: raw.allergens || '',
        nutrition_grades: raw.nutrition_grades || '',
        categories: raw.categories || '',
        brands: raw.brands || '',
        countries: raw.countries || ''
      };
      
      // Generate embeddings
      try {
        product.ingredients_embedding = await generateEmbedding(product.ingredients_text);
        product.product_name_embedding = await generateEmbedding(product.product_name);
        product.allergens_embedding = await generateEmbedding(product.allergens);
        
        products.push(product);
        
        // Batch insert every 50 products
        if (products.length === 50) {
          await collection.insertMany(products, { ordered: false });
          console.log(`Inserted batch of ${products.length} products`);
          products.length = 0;
        }
        
        // Rate limit for OpenAI API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing ${raw.product_name}:`, error);
      }
    }
    
    // Insert remaining products
    if (products.length > 0) {
      await collection.insertMany(products, { ordered: false });
      console.log(`Inserted final batch of ${products.length} products`);
    }
    
    console.log('✅ Product loading complete!');
    
  } catch (error) {
    console.error('❌ Error loading products:', error);
  } finally {
    await client.close();
  }
}

loadProducts();
