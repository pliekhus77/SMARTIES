import * as fs from 'fs';
import * as readline from 'readline';

async function extractTop100() {
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
        products.push({
          code: product.code,
          product_name: product.product_name,
          ingredients_text: product.ingredients_text,
          allergens: product.allergens || '',
          unique_scans_n: product.unique_scans_n,
          categories: product.categories || '',
          brands: product.brands || ''
        });
      }
      
      lineCount++;
      if (lineCount % 10000 === 0) {
        console.log(`Processed ${lineCount} lines, found ${products.length} valid products`);
      }
      
    } catch (error) {
      continue;
    }
  }
  
  products.sort((a, b) => b.unique_scans_n - a.unique_scans_n);
  const top100 = products.slice(0, 100);
  
  fs.writeFileSync('/mnt/c/git/SMARTIES/top-100-products.json', JSON.stringify(top100, null, 2));
  
  console.log(`✅ Top 100 products saved to top-100-products.json`);
  console.log(`Most popular: ${top100[0].product_name} (${top100[0].unique_scans_n} scans)`);
}

extractTop100();
