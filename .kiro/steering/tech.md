# Technology Stack & Architecture

## Core Tech Stack

### Database & Backend
- **Primary Database**: MongoDB Atlas (operational + vector database)
- **Backend Runtime**: Node.js
- **Database SDK**: MongoDB Realm SDK for real-time sync
- **Vector Search**: Atlas Vector Search for ingredient similarity matching
- **Text Search**: Atlas Text Search for product discovery and fuzzy matching

### Mobile Application
- **Framework**: React Native (cross-platform iOS/Android)
- **Barcode Scanning**: expo-barcode-scanner for UPC scanning
- **Camera Integration**: React Native camera APIs
- **Offline Support**: MongoDB Realm for local caching

### AI & Machine Learning
- **GenAI Provider**: OpenAI/Anthropic API for RAG responses
- **Embeddings**: Sentence transformers for ingredient vectors
- **RAG Pipeline**: Retrieval-Augmented Generation for personalized advice
- **Vector Embeddings**: For ingredient similarity and product recommendations

### Data Sources
- **Open Food Facts**: 2+ million food products with allergen information
- **USDA Food Data Central**: 600,000+ food items with nutritional data
- **Recipe1M+**: 1+ million recipes for ingredient analysis
- **Nutrition5k**: High-quality training data with accurate nutritional info

## Architecture Patterns

### RAG (Retrieval-Augmented Generation) Pipeline
1. **UPC Scan** → Retrieve product from Atlas
2. **Vector Search** → Find similar products using Atlas Vector Search
3. **Context Retrieval** → Gather user history + similar product patterns
4. **LLM Generation** → Generate personalized dietary advice
5. **Agentic Response** → Proactive recommendations and warnings

### MongoDB Atlas Integration Patterns
- **Flexible Document Model**: Store UPC, ingredients, allergens, nutritional data
- **Aggregation Pipelines**: Complex dietary rule evaluation and risk scoring
- **Real-time Sync**: Offline-first with Atlas sync capabilities
- **Multi-collection Queries**: Products, user profiles, scan history

### Agentic AI Features
- **Learning Agent**: Continuously improves recommendations based on user feedback
- **Proactive Alerts**: Warn about potential issues based on similar product patterns
- **Smart Recommendations**: Suggest safe alternatives based on scan history
- **Contextual Insights**: Identify patterns in user dietary choices

## Common Commands

### Development Setup
```bash
# Install dependencies
npm install

# Start React Native development server
npx react-native start

# Run on iOS simulator
npx react-native run-ios

# Run on Android emulator
npx react-native run-android
```

### Database Operations
```bash
# Connect to MongoDB Atlas
mongosh "mongodb+srv://cluster.mongodb.net/smarties"

# Import product data
mongoimport --uri="mongodb+srv://cluster.mongodb.net/smarties" --collection=products --file=products.json

# Create vector search index
# (Done via Atlas UI or MongoDB Compass)
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run barcode scanning tests
npm run test:barcode
```

### Build & Deployment
```bash
# Build for production
npm run build

# Generate Android APK
cd android && ./gradlew assembleRelease

# Generate iOS build
cd ios && xcodebuild -workspace Smarties.xcworkspace -scheme Smarties archive
```

## Code Style & Conventions
- **JavaScript/TypeScript**: ES6+ with async/await patterns
- **React Native**: Functional components with hooks
- **MongoDB**: Aggregation pipelines for complex queries
- **Error Handling**: Comprehensive try/catch with user-friendly messages
- **Offline-First**: Design for intermittent connectivity
- **Security**: Never store sensitive data in plain text, use Atlas encryption