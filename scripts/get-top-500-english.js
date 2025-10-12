const fs = require('fs');

async function getTop500English() {
  console.log('Fetching top 500 English products...');
  
  const response = await fetch(
    'https://world.openfoodfacts.org/cgi/search.pl?' +
    'action=process&' +
    'tagtype_0=languages&tag_contains_0=contains&tag_0=en:english&' +
    'sort_by=unique_scans_n&' +
    'page_size=500&' +
    'json=1&' +
    'fields=code,product_name,ingredients_text,allergens,categories,brands,unique_scans_n'
  );
  
  const data = await response.json();
  
  if (data.products) {
    const validProducts = data.products.filter(p => 
      p.code && 
      p.product_name && 
      p.ingredients_text
    );
    
    fs.writeFileSync('/mnt/c/git/SMARTIES/top-500-english.json', JSON.stringify(validProducts, null, 2));
    console.log(`✅ Saved ${validProducts.length} top English products`);
    
    if (validProducts.length > 0) {
      console.log(`Most popular: ${validProducts[0].product_name} (${validProducts[0].unique_scans_n || 0} scans)`);
    }
  } else {
    console.log('No products found');
  }
}

getTop500English();
