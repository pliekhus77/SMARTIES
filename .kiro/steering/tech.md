---
inclusion: always
---

# SMARTIES Technology Stack & Development Guidelines

## Required Technology Stack

### Core Technologies (Non-Negotiable)
- **Mobile Framework**: React Native with TypeScript
- **Database**: MongoDB Atlas with Realm SDK for offline sync
- **AI/ML**: OpenAI/Anthropic APIs for dietary analysis
- **Barcode Scanning**: expo-barcode-scanner
- **Vector Search**: MongoDB Atlas Vector Search

### Data Sources Integration
- **Primary**: Open Food Facts API for product data
- **Secondary**: USDA Food Data Central for nutritional info
- **Fallback**: Manual user submissions with moderation

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

### MongoDB Integration Patterns
```typescript
// Use aggregation pipelines for complex queries
const dietaryAnalysis = await db.collection('products').aggregate([
  { $match: { upc: barcode } },
  { $lookup: { from: 'allergens', localField: 'ingredients', foreignField: 'name' } },
  { $addFields: { riskScore: { $sum: '$allergens.severity' } } }
]);

// Always use proper error handling
try {
  const result = await realm.write(() => {
    return realm.create('Product', productData);
  });
} catch (error) {
  console.error('Database write failed:', error);
  throw new DatabaseError('Failed to save product');
}
```

### AI/RAG Implementation Guidelines
```typescript
// Structure AI requests with proper context
const dietaryAdvice = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: "You are a dietary safety assistant..." },
    { role: "user", content: `Analyze product: ${productData}` }
  ],
  temperature: 0.1 // Low temperature for safety-critical responses
});

// Always validate AI responses
const validatedResponse = validateDietaryAdvice(dietaryAdvice);
if (!validatedResponse.isValid) {
  throw new AIValidationError('Invalid dietary advice generated');
}
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