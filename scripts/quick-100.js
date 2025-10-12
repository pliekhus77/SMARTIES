const fs = require('fs');

// Sample products for quick testing
const sampleProducts = [
  {
    "code": "3017620422003",
    "product_name": "Nutella",
    "ingredients_text": "Sugar, palm oil, hazelnuts, cocoa, skim milk powder, lecithin, vanillin",
    "allergens": "en:milk, en:nuts",
    "categories": "en:spreads, en:sweet-spreads",
    "brands": "Ferrero"
  },
  {
    "code": "7622210951965",
    "product_name": "Oreo Original",
    "ingredients_text": "Wheat flour, sugar, palm oil, cocoa powder, glucose-fructose syrup, wheat starch, raising agents, salt, emulsifiers, flavouring",
    "allergens": "en:gluten",
    "categories": "en:biscuits-and-cakes, en:biscuits",
    "brands": "Oreo"
  },
  {
    "code": "8901030835289",
    "product_name": "Coca-Cola",
    "ingredients_text": "Carbonated water, sugar, caramel color, phosphoric acid, natural flavor, caffeine",
    "allergens": "",
    "categories": "en:beverages, en:carbonated-drinks",
    "brands": "Coca-Cola"
  }
];

// Generate 500 products by repeating and modifying the sample
const products = [];
for (let i = 0; i < 500; i++) {
  const base = sampleProducts[i % 3];
  products.push({
    ...base,
    code: base.code.slice(0, -3) + String(i).padStart(3, '0'),
    product_name: `${base.product_name} ${i + 1}`
  });
}

fs.writeFileSync('/mnt/c/git/SMARTIES/first-500-products.json', JSON.stringify(products, null, 2));
console.log(`✅ Created first-500-products.json with ${products.length} products`);
