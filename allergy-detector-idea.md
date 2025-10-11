# SMARTIES - Scan‑based Mobile Allergen Risk Tracking & IntelligencE Suite
Personalized Food Safety, Powered by AI.

## Product Overview

**Mission**: Instantly identify dietary restrictions, allergens, and nutritional concerns through UPC barcode scanning to keep users safe and compliant with their dietary needs.

**Core Value Proposition**: Scan any packaged food's barcode and get immediate safety warnings based on your personal dietary profile - allergies, religious restrictions, medical conditions, and lifestyle choices.

**Primary Function**: UPC barcode scanning for comprehensive dietary compliance checking
**Coverage**: Allergies, religious restrictions (Halal, Kosher, Hindu), medical conditions (diabetes, hypertension), lifestyle choices (vegan, keto)
**Future Phases**: Package image recognition → Prepared food/plate image recognition

## Data Sources

### Primary Datasets

#### Open Food Facts
- **URL**: https://world.openfoodfacts.org/
- **API**: https://wiki.openfoodfacts.org/API
- **Download**: https://world.openfoodfacts.org/data
- **Content**: 2+ million food products with ingredient lists and allergen information
- **Coverage**: Global products with multiple languages
- **Format**: MongoDB dumps, CSV, API access
- **License**: Open Database License (free for commercial use)
- **Best For**: Packaged/processed foods with existing allergen labels

#### USDA Food Data Central
- **URL**: https://fdc.nal.usda.gov/
- **API**: https://fdc.nal.usda.gov/api-guide.html
- **Content**: 600,000+ food items with detailed nutritional and ingredient data
- **Coverage**: Comprehensive US food database
- **Format**: JSON, CSV downloads + REST API
- **License**: Public domain (US government data)
- **Best For**: Ingredient-to-allergen mappings and nutritional analysis

#### Recipe1M+
- **URL**: http://pic2recipe.csail.mit.edu/
- **GitHub**: https://github.com/torralba-lab/im2recipe-Pytorch
- **Content**: 1+ million recipes with images and ingredient lists
- **Coverage**: Diverse cuisines and homemade dishes
- **Format**: JSON files with image URLs
- **License**: Academic/research use
- **Best For**: Homemade/restaurant dishes with ingredient breakdowns

#### Nutrition5k
- **URL**: https://github.com/google-research-datasets/Nutrition5k
- **Content**: 5,006 food images with detailed nutritional analysis
- **Coverage**: Scientifically analyzed food items
- **Format**: Images + JSON metadata
- **License**: Research use agreement
- **Best For**: High-quality training data with accurate nutritional info

### Secondary/Supplementary Sources

#### Food-101
- **Content**: 101 food categories, 101,000 images
- **Best For**: Basic food classification training
- **Limitation**: No ingredient or allergen data

#### Food2k
- **Content**: 2,000 food categories
- **Coverage**: More granular classifications than Food-101
- **Availability**: Contact research authors

## Key Features

### 🔍 UPC Barcode Scanning (Primary Function)
- Real-time barcode scanning of packaged food products
- Instant product lookup via comprehensive dietary databases
- Multi-category compliance checking: allergies, religious, medical, lifestyle
- Works offline with cached product database
- Support for various barcode formats (UPC-A, UPC-E, EAN-13, etc.)

### 🕌 Religious Dietary Compliance
- **Halal Verification**: Pork, alcohol, and non-halal ingredient detection
- **Kosher Checking**: Dairy/meat separation, kosher certification validation
- **Hindu Dietary**: Beef detection and vegetarian compliance
- **Jain Restrictions**: Root vegetable and honey identification
- **Certification Integration**: Recognize official religious certification symbols

### 🏥 Medical Condition Management
- **Diabetes Support**: Sugar content, carb counting, glycemic index warnings
- **Hypertension**: Sodium content alerts and heart-healthy recommendations
- **Kidney Disease**: Potassium, phosphorus, and protein monitoring
- **Celiac Disease**: Gluten detection beyond basic wheat allergens
- **FODMAP Sensitivity**: Low-FODMAP diet compliance checking

### 🌱 Lifestyle & Preference Tracking
- **Vegan/Vegetarian**: Animal product detection including hidden ingredients
- **Keto Diet**: Carb content and macro tracking
- **Paleo Compliance**: Processed ingredient and grain detection
- **Organic Preference**: Organic certification and pesticide alerts
- **Low-Sodium**: Heart-healthy sodium level monitoring

### 📱 Future Image Recognition Phases
- **Phase 2**: Package image recognition (when barcode isn't scannable)
- **Phase 3**: Prepared food/plate image recognition for restaurant/homemade meals
- AI-powered identification using computer vision models

### 🚦 Multi-Category Alert System
- **Red**: Forbidden - contains restricted ingredients (allergens, haram, high sodium for hypertension)
- **Yellow**: Caution - may contain traces, check certification, or monitor portions
- **Green**: Safe - compliant with all dietary restrictions and preferences
- **Blue**: Recommended - actively beneficial for medical conditions or goals
- **Category Icons**: Visual indicators for allergy, religious, medical, lifestyle alerts

### 👤 Comprehensive Dietary Profile
- **Allergy Management**: Severity levels and cross-contamination sensitivity
- **Religious Preferences**: Multiple faith-based dietary laws
- **Medical Conditions**: Doctor-prescribed dietary restrictions with severity
- **Lifestyle Choices**: Personal preferences and ethical considerations
- **Family Profiles**: Manage multiple users with different restriction combinations
- **Temporary Restrictions**: Pregnancy, medication interactions, recovery diets

### 🤖 GenAI-Powered Dietary Intelligence
- **Multi-Category RAG**: Personalized advice covering allergies, religious, medical, and lifestyle needs
- **Smart Alternative Discovery**: Atlas Text Search for finding compliant substitutes
- **Holistic Health Agent**: AI learns patterns across all dietary categories
- **Cultural Context**: Provide culturally sensitive advice that considers religious and medical needs
- **Predictive Insights**: Learn from community patterns to provide proactive warnings
- **Goal Tracking**: Monitor progress toward dietary and health objectives

### 📊 Atlas Aggregation Analytics
- **Multi-Dimensional Compliance**: Track adherence across all dietary categories
- **Health Trend Analysis**: Correlate food choices with medical condition management
- **Community Insights**: Learn from users with similar restriction combinations
- **Seasonal Pattern Detection**: Religious holiday food compliance tracking
- **Goal Progress**: Macro tracking, medical target adherence, lifestyle consistency

## Technical Architecture

### MongoDB Atlas Integration

#### Atlas Document Collections
- **Products Collection**: Store comprehensive dietary data including UPC codes, ingredients, allergens, religious compliance, medical information, lifestyle compatibility, and certifications
- **User Profiles Collection**: Manage multi-category restrictions including allergies with severity levels, religious preferences, medical conditions with targets, and lifestyle choices
- **Scan History Collection**: Track compliance results across all categories with timestamps and risk assessments

#### Atlas Vector Search for RAG
- **Ingredient Embeddings**: Vector representations of ingredients for similarity matching
- **Product Embeddings**: Semantic search across product descriptions and ingredients
- **User Pattern Embeddings**: Personalized recommendations based on scan history

#### Atlas Text Search Integration
- Full-text search across product names, brands, and ingredients
- Fuzzy matching for ingredient variations
- Multi-language support for international products

### GenAI-Powered RAG Pipeline
1. **UPC Scan** → Retrieve product from Atlas
2. **Vector Search** → Find similar products using Atlas Vector Search
3. **Context Retrieval** → Gather user history + similar product patterns
4. **LLM Generation** → Generate personalized dietary advice using retrieved context
5. **Agentic Response** → Proactive recommendations and warnings

### Agentic AI Features
- **Smart Recommendations**: Suggest safe alternatives based on scan history
- **Proactive Alerts**: Warn about potential issues based on similar product patterns
- **Learning Agent**: Continuously improves recommendations based on user feedback
- **Contextual Insights**: Identify patterns in user dietary choices and reactions

### Mobile App Stack
- **Frontend**: React Native with MongoDB Realm SDK
- **Backend**: Node.js with MongoDB Atlas
- **Vector DB**: MongoDB Atlas Vector Search
- **GenAI**: OpenAI/Anthropic API for RAG responses
- **ML Models**: Sentence transformers for embeddings

## 24-Hour Hackathon Implementation Plan

### Hour 0-2: MongoDB Atlas Setup
- Set up MongoDB Atlas cluster with Vector Search enabled
- Create collections for products, users, and scan history
- Import initial product data from Open Food Facts into Atlas
- Set up Atlas Text Search indexes for product discovery
- Configure vector embeddings for ingredient similarity

### Hour 2-8: Core UPC + Multi-Category Atlas Integration
- Implement barcode scanning with React Native
- Connect to MongoDB Atlas with comprehensive dietary data model
- Build multi-category compliance checking (allergies, religious, medical, lifestyle)
- Create vector embeddings for ingredient and dietary pattern matching
- Implement Atlas aggregation for complex dietary rule evaluation

### Hour 8-14: GenAI RAG for Holistic Dietary Advice
- Integrate OpenAI/Anthropic API for multi-category LLM responses
- Build RAG pipeline: scan → vector search → multi-category context → personalized advice
- Implement Atlas Vector Search for similar user pattern matching
- Create holistic dietary recommendations considering all user restrictions
- Add Atlas Text Search for compliant product alternatives across categories

### Hour 14-20: Advanced Agentic Features
- Build learning agent for multi-dimensional dietary pattern recognition
- Implement proactive warnings across all dietary categories
- Create Atlas aggregation pipelines for cross-category trend analysis
- Add contextual insights that consider cultural sensitivity and medical accuracy
- Polish GenAI responses for comprehensive dietary guidance

### Hour 20-24: Demo Prep & Atlas Showcase
- Create demo highlighting Atlas document flexibility
- Prepare examples of Vector Search and Text Search capabilities
- Show real-time aggregation analytics and insights
- Record demo showcasing RAG-powered personalized recommendations
- Practice pitch emphasizing Atlas as the core data backbone

## MVP Scope (24-Hour Hackathon)
- **Primary Database**: MongoDB Atlas with comprehensive dietary compliance data
- **Core Categories**: Allergies, Halal/Kosher, Diabetes, Vegan/Vegetarian
- **GenAI Integration**: RAG pipeline for holistic dietary advice
- **Atlas Features**: Multi-category document model, complex aggregation pipelines
- **Agentic AI**: Cross-category learning and recommendations
- **Platform**: React Native with MongoDB Realm SDK

### Target User Categories
- **Religious Communities**: Muslims (Halal), Jews (Kosher), Hindus (vegetarian), Jains
- **Medical Patients**: Diabetics, hypertension, kidney disease, celiac
- **Lifestyle Followers**: Vegans, vegetarians, keto, paleo, organic enthusiasts
- **Allergy Sufferers**: Traditional allergen management with expanded context

## Hackathon Tech Stack
- **Database**: MongoDB Atlas (operational + vector database)
- **Frontend**: React Native with MongoDB Realm SDK
- **Barcode**: expo-barcode-scanner for UPC scanning
- **GenAI**: OpenAI/Anthropic API for RAG responses
- **Vector Search**: Atlas Vector Search for similarity matching
- **Text Search**: Atlas Text Search for product discovery
- **Embeddings**: Sentence transformers for ingredient vectors

## Full Development Plan (12 Months)

### Phase 1: Foundation (Months 1-3)
- Data collection and processing from all sources
- Vector database setup with comprehensive food embeddings
- Core AI model training and validation
- Basic mobile app with camera integration
- User profile management system

### Phase 2: Core Features (Months 4-6)
- Complete alert system implementation
- Offline capability deployment
- Comprehensive food logging
- Model accuracy improvements
- Beta testing program

### Phase 3: Enhancement (Months 7-9)
- Advanced analytics and insights
- Restaurant partnership integration
- Cultural food expansion
- Family profile management
- API development and scaling

### Phase 4: Launch (Months 10-12)
- Production deployment and scaling
- App store submission and approval
- Marketing campaign execution
- Healthcare partnerships
- Premium feature rollout

## Business Model

### Monetization Strategy
- **Freemium Model**: Basic scanning free, premium features paid
- **Premium Features**: Advanced analytics, family profiles, restaurant integration
- **B2B Partnerships**: Integration with restaurants, grocery stores
- **Healthcare Integration**: Data sharing with medical providers

### Target Market
- **Primary**: 100M+ Americans with dietary restrictions (allergies, medical, religious)
- **Religious Communities**: 8M Muslims, 6M Jews, 2.3M Hindus in US
- **Medical Patients**: 37M diabetics, 116M with hypertension, 3M with celiac
- **Lifestyle Followers**: 10M vegans, 23M vegetarians, 5M+ keto dieters
- **Families**: Multi-restriction households needing comprehensive management

## MongoDB Atlas Showcase Features

### 🗄️ Flexible Document Model
- **Product Documents**: Store UPC, ingredients, allergens, and nutritional data in flexible schema
- **User Profiles**: Dynamic allergen lists with severity levels and preferences
- **Scan History**: Rich documents with timestamps, locations, and risk assessments
- **Schema Evolution**: Easy addition of new allergen types and product attributes

### 🔍 Atlas Text Search
- **Product Discovery**: Search by product name, brand, or ingredient
- **Fuzzy Matching**: Handle ingredient variations ("milk" → "dairy")
- **Multi-language**: Support international product names and ingredients
- **Autocomplete**: Real-time search suggestions for safe product alternatives

### 📊 Aggregation Framework
- **Risk Scoring**: Calculate personalized allergen risk using aggregation pipelines
- **Trend Analysis**: Identify allergen patterns across user base
- **Brand Safety**: Aggregate community scan data for brand reliability scores
- **Usage Analytics**: Real-time insights into scanning patterns and preferences

### 🧠 Atlas Vector Search for RAG
- **Ingredient Similarity**: Vector embeddings for ingredient matching and substitutions
- **Product Recommendations**: Find similar safe products using semantic search
- **User Pattern Matching**: Identify users with similar allergen profiles
- **Contextual Retrieval**: Gather relevant product and user data for LLM context

### 🤖 GenAI Integration Patterns
- **RAG Pipeline**: Retrieve user history + similar products → Generate personalized advice
- **Agentic AI**: Proactive recommendations that learn from user behavior
- **Contextual Responses**: "Based on your scan history, this product may contain hidden dairy"
- **Smart Alternatives**: "Users with similar profiles prefer these safe options"

## Success Metrics
- **Accuracy**: >95% food identification accuracy
- **Speed**: <3 second scan-to-result time
- **Safety**: Zero false negatives for severe allergens
- **Engagement**: Daily active usage for meal planning
- **Growth**: 100K+ users within first year

## Risk Mitigation
- **Liability**: Clear medical disclaimers and accuracy limitations
- **Data Quality**: Multi-source validation and crowdsourced verification
- **Technical**: Robust offline fallbacks and error handling
- **Regulatory**: Compliance with FDA guidelines for health apps

## Future Enhancements
- Integration with smart kitchen appliances
- Barcode scanning for packaged foods
- Voice-activated allergen checking
- Integration with meal delivery services
- Wearable device notifications
- AI-powered meal planning and shopping lists