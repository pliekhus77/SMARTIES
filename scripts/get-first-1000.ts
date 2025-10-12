import * as fs from 'fs';
import * as readline from 'readline';

async function getFirst1000() {
  const fileStream = fs.createReadStream('/mnt/c/git/SMARTIES/datadumps/openfoodfacts-mongodbdump');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const products: any[] = [];
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const product = JSON.parse(line);
      
      if (product.code && product.product_name && product.ingredients_text) {
        products.push({
          code: product.code,
          product_name: product.product_name,
          ingredients_text: product.ingredients_text,
          allergens: product.allergens || '',
          categories: product.categories || '',
          brands: product.brands || ''
        });
        
        if (products.length >= 1000) {
          console.log(`✅ Found 1000 products, stopping...`);
          break;
        }
        
        if (products.length % 100 === 0) {
          console.log(`Found ${products.length} products...`);
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  fs.writeFileSync('/mnt/c/git/SMARTIES/first-1000-products.json', JSON.stringify(products, null, 2));
  console.log(`✅ Saved ${products.length} products to first-1000-products.json`);
}

getFirst1000();
