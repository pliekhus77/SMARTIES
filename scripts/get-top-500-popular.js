const fs = require('fs');

async function getTop500Popular() {
  console.log('Fetching top 500 most popular products by scan count...');
  
  const response = await fetch(
    'https://world.openfoodfacts.org/cgi/search.pl?' +
    'action=process&' +
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
      p.ingredients_text && 
      p.unique_scans_n > 0
    );
    
    fs.writeFileSync('/mnt/c/git/SMARTIES/top-500-popular.json', JSON.stringify(validProducts, null, 2));
    console.log(`✅ Saved ${validProducts.length} top popular products`);
    
    if (validProducts.length > 0) {
      console.log(`Most popular: ${validProducts[0].product_name} (${validProducts[0].unique_scans_n} scans)`);
      console.log(`Least popular in top 500: ${validProducts[validProducts.length-1].product_name} (${validProducts[validProducts.length-1].unique_scans_n} scans)`);
    }
  } else {
    console.log('No products found');
  }
}

getTop500Popular();
