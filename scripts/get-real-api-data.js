const fs = require('fs');

async function getRealProducts() {
  const products = [];
  
  // Get 5 pages of 100 products each = 500 products
  for (let page = 1; page <= 5; page++) {
    console.log(`Fetching page ${page}...`);
    
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?action=process&page_size=100&page=${page}&json=1&fields=code,product_name,ingredients_text,allergens,categories,brands,unique_scans_n`
    );
    
    const data = await response.json();
    
    if (data.products) {
      products.push(...data.products.filter(p => p.code && p.product_name && p.ingredients_text));
    }
    
    console.log(`Total products so far: ${products.length}`);
  }
  
  fs.writeFileSync('/mnt/c/git/SMARTIES/real-500-products.json', JSON.stringify(products.slice(0, 500), null, 2));
  console.log(`✅ Saved ${Math.min(products.length, 500)} real products from Open Food Facts API`);
}

getRealProducts();
