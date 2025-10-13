---
inclusion: always
---

# SMARTIES Technology Stack & Development Guidelines

## Required Technology Stack

### Core Technologies (Non-Negotiable)
- **Mobile Framework**: React Native with TypeScript
- **Local Storage**: AsyncStorage with encryption for user profiles and cache
- **AI/ML**: OpenAI/Anthropic APIs for dietary analysis
- **Barcode Scanning**: Google ML Kit (Android) / Apple Vision (iOS) via react-native wrapper
- **Product Data**: Open Food Facts API (direct HTTP calls)

### Data Sources Integration
- **Primary**: Open Food Facts API (world.openfoodfacts.org/api/v2/product/{barcode}.json)
- **Secondary**: Open Beauty Facts, Open Pet Food Facts (same API structure)
- **Fallback**: Manual barcode entry and "Add Product" redirect to Open Food Facts

## Development Patterns & Conventions

### Code Organization Rules
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen-level components
├── services/           # Business logic and API calls
├── models/             # Data models and types
├── utils/              # Helper functions
└── config/             # Configuration files
```

### Naming Conventions
- **Files**: PascalCase for components (`ScannerScreen.tsx`), camelCase for utilities (`allergenDetection.ts`)
- **Components**: PascalCase (`ProductCard`, `DietaryAlert`)
- **Functions**: camelCase (`checkAllergens`, `processBarcode`)
- **Constants**: UPPER_SNAKE_CASE (`DIETARY_RESTRICTIONS`, `API_ENDPOINTS`)

### TypeScript Requirements
- Always use TypeScript, never plain JavaScript
- Define interfaces for all data models
- Use strict null checks and proper error handling
- Export types alongside implementations

### React Native Patterns
```typescript
// Use functional components with hooks
const ScannerScreen: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  
  // Always handle loading and error states
  const { data, loading, error } = useProductLookup(barcode);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ProductDisplay product={data} />;
};
```

### Open Food Facts API Integration Patterns
```typescript
// Direct API calls to Open Food Facts
const fetchProduct = async (barcode: string): Promise<Product | null> => {
  const normalizedBarcode = barcode.padStart(13, '0'); // Normalize barcode
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${normalizedBarcode}.json`,
    {
      headers: {
        'User-Agent': 'SMARTIES - React Native - Version 1.0 - https://smarties.app - scan'
      }
    }
  );
  
  const data = await response.json();
  return data.status === 1 ? data.product : null;
};

// Local caching with AsyncStorage
const cacheProduct = async (barcode: string, product: Product) => {
  try {
    await AsyncStorage.setItem(`product_${barcode}`, JSON.stringify(product));
  } catch (error) {
    console.error('Cache write failed:', error);
  }
};
```

### AI Dietary Analysis Implementation
```typescript
// Analyze product against user dietary restrictions
const analyzeDietaryCompliance = async (
  product: OpenFoodFactsProduct, 
  userProfile: UserProfile
): Promise<DietaryAnalysis> => {
  const prompt = `
    Analyze this product for dietary compliance:
    Product: ${product.product_name}
    Ingredients: ${product.ingredients_text}
    Allergens: ${product.allergens}
    User restrictions: ${userProfile.restrictions.join(', ')}
    
    Return JSON with: { safe: boolean, violations: string[], warnings: string[] }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a dietary safety assistant. Always err on the side of caution." },
      { role: "user", content: prompt }
    ],
    temperature: 0.1
  });

  return JSON.parse(response.choices[0].message.content);
};
```

### Error Handling Standards
```typescript
// Use custom error classes
export class ProductNotFoundError extends Error {
  constructor(barcode: string) {
    super(`Product not found: ${barcode}`);
    this.name = 'ProductNotFoundError';
  }
}

// Always provide user-friendly error messages
const handleScanError = (error: Error) => {
  if (error instanceof ProductNotFoundError) {
    showUserMessage('Product not found. Try manual entry.');
  } else {
    showUserMessage('Scanning failed. Please try again.');
    logError(error); // Log technical details separately
  }
};
```

### Performance Requirements
- Barcode scan to result: <3 seconds
- App startup: <2 seconds to scanner ready
- Offline functionality: Core features must work without network
- Memory usage: <100MB during normal operation

### Security Guidelines
- Never store API keys in code - use environment variables
- Encrypt sensitive user data using device keychain
- Validate all user inputs before processing
- Use HTTPS for all API communications
- Implement proper authentication for user data sync

### Testing Requirements
```typescript
// Test critical paths thoroughly
describe('Dietary Analysis', () => {
  it('should detect allergens correctly', async () => {
    const product = mockProductWithAllergens(['milk', 'eggs']);
    const userProfile = mockUserProfile(['dairy allergy']);
    
    const result = await analyzeDietaryCompliance(product, userProfile);
    
    expect(result.hasViolations).toBe(true);
    expect(result.violations).toContain('dairy');
  });
});
```

### Development Commands
```bash
# Setup
npm install
npx react-native start

# Testing
npm test                    # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests

# Platform-specific
npx react-native run-ios     # iOS development
npx react-native run-android # Android development

# Production builds
npm run build:ios
npm run build:android
```

### Code Quality Standards
- Use ESLint and Prettier for consistent formatting
- Maintain >80% test coverage for critical paths
- Use meaningful commit messages following conventional commits
- All components must be accessible (screen reader compatible)
- Handle all async operations with proper loading states