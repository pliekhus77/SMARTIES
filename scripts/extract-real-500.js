const fs = require('fs');
const readline = require('readline');

async function extractReal500() {
  const fileStream = fs.createReadStream('/mnt/c/git/SMARTIES/datadumps/openfoodfacts-mongodbdump');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const products = [];
  let lineCount = 0;
  
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
          brands: product.brands || '',
          unique_scans_n: product.unique_scans_n || 0
        });
        
        if (products.length >= 500) {
          console.log(`✅ Found 500 real products, stopping...`);
          break;
        }
        
        if (products.length % 50 === 0) {
          console.log(`Found ${products.length} products...`);
        }
      }
    } catch (error) {
      continue;
    }
    
    lineCount++;
    if (lineCount % 1000 === 0) {
      console.log(`Processed ${lineCount} lines...`);
    }
  }
  
  fs.writeFileSync('/mnt/c/git/SMARTIES/real-500-products.json', JSON.stringify(products, null, 2));
  console.log(`✅ Saved ${products.length} real products to real-500-products.json`);
  if (products.length > 0) {
    console.log(`First product: ${products[0].product_name}`);
  }
}

extractReal500();
