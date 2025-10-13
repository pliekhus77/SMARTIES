---
inclusion: always
---

# SMARTIES Product Guide

**SMARTIES** (Scan‑based Mobile Allergen Risk Tracking & IntelligencE Suite) is a React Native mobile application that provides instant dietary compliance checking through UPC barcode scanning, powered by Open Food Facts API and AI.

## Core Product Principles

### Safety-First Design
- **Zero False Negatives**: Never miss a dietary restriction violation
- **Clear Warnings**: Use red alerts for violations, yellow for cautions, green for safe
- **Offline Capability**: Core safety features must work without internet connection
- **Multi-Language Support**: Critical for diverse user base

### User Experience Standards
- **Scan-First Interface**: Barcode scanner is the primary entry point
- **Sub-3-Second Response**: From scan to result display
- **One-Tap Actions**: Save products, mark favorites, report issues
- **Accessibility**: Full VoiceOver/TalkBack support for visually impaired users

## Domain Model & Business Rules

### Dietary Restrictions (Core Entities)
- **Allergies**: FDA Top 9 + additional (tree nuts, shellfish, dairy, eggs, soy, wheat, fish, peanuts, sesame)
- **Religious**: Halal, Kosher, Hindu vegetarian, Jain, Buddhist
- **Medical**: Diabetes (sugar/carb limits), hypertension (sodium limits), celiac (gluten-free), kidney disease (potassium/phosphorus)
- **Lifestyle**: Vegan, vegetarian, keto, paleo, organic-only, non-GMO

### Compliance Logic
- **Strict Mode**: Any violation = red warning (default for allergies/medical)
- **Flexible Mode**: Warnings with user choice (lifestyle preferences)
- **Ingredient Hierarchy**: Check base ingredients, additives, processing aids, cross-contamination risks
- **Certification Priority**: Trust certified labels (Halal/Kosher symbols) over ingredient analysis

### Product Data Sources
- **Primary**: Open Food Facts API (2M+ products) - Direct API access
- **Secondary**: Open Beauty Facts, Open Pet Food Facts (via same API structure)
- **Fallback**: Manual barcode entry when scanning fails
- **Real-time**: Barcode scanning with immediate API lookup

## Technical Architecture Guidelines

### Data Flow Patterns
1. **Scan → API Lookup → Analyze → Alert → Cache**
2. **API-First**: Direct calls to Open Food Facts API for product data
3. **Local Caching**: Cache user profile + recent products for offline access
4. **AI Pipeline**: Product data → LLM analysis → Dietary compliance check

### Performance Requirements
- **Barcode Recognition**: <1 second
- **API Lookup**: <2 seconds for Open Food Facts API call
- **AI Analysis**: <3 seconds for dietary compliance check
- **App Launch**: <2 seconds to scanner ready
- **Battery Impact**: <5% drain per hour of active scanning

### Security & Privacy
- **Local Storage**: User profiles and cached products encrypted with device keychain
- **Data Minimization**: Only store necessary dietary restrictions and recent scans
- **No Backend**: No user data stored on our servers - privacy by design
- **GDPR Compliance**: Local data only, easy deletion and export

## Feature Prioritization Framework

### MVP (Phase 1) - UPC Scanning
**Must Have**: Barcode scanning, basic allergen detection, user profile setup, offline core functionality
**Should Have**: Product favorites, scan history, basic recommendations
**Could Have**: Social sharing, advanced analytics
**Won't Have**: Image recognition, restaurant integration

### Phase 2 - Enhanced Recognition
**Focus**: Package image recognition when barcodes fail, improved AI accuracy, family profiles

### Phase 3 - Prepared Foods
**Focus**: Plate/meal image recognition, restaurant menu integration, recipe analysis

## Development Guidelines

### Code Organization
- **Feature-Based Structure**: Group by user journey (scanning, profile, history, settings)
- **Shared Components**: Reusable UI components for dietary warnings, product cards, scan results
- **Service Layer**: Separate business logic from UI (dietary analysis, product lookup, user management)

### Testing Strategy
- **Critical Path Testing**: Barcode scanning → product lookup → dietary analysis → warning display
- **Edge Case Coverage**: Unknown products, network failures, corrupted barcodes, multiple restrictions
- **Performance Testing**: Scan speed, memory usage, battery impact
- **Accessibility Testing**: Screen reader compatibility, high contrast mode

### Error Handling Patterns
- **Graceful Degradation**: Show cached data when offline, basic analysis when AI unavailable
- **User Communication**: Clear error messages with suggested actions
- **Fallback Strategies**: Manual product entry, image-based ingredient extraction
- **Logging**: Comprehensive error tracking for product improvement

## Business Logic Rules

### Dietary Analysis Priority
1. **Certified Labels** (Halal/Kosher symbols) override ingredient analysis
2. **Allergen Warnings** take precedence over lifestyle preferences
3. **Medical Restrictions** cannot be overridden by user
4. **Cross-Contamination** warnings for manufacturing facilities

### User Profile Management
- **Onboarding Flow**: Dietary restrictions → severity levels → notification preferences
- **Profile Updates**: Immediate re-analysis of saved products
- **Family Profiles**: Multiple restriction sets with switching capability
- **Temporary Restrictions**: Time-limited dietary needs (pregnancy, medication)

### Product Database Management
- **Open Food Facts Integration**: Leverage community-maintained database
- **Local Caching**: Cache recently scanned products for offline access
- **User Contributions**: Direct users to Open Food Facts for product additions
- **Data Quality**: Trust Open Food Facts community verification process

## Success Metrics

### User Safety (Primary)
- **Zero Critical Misses**: No false negatives for severe allergies
- **Accuracy Rate**: >99% for allergen detection, >95% for lifestyle preferences
- **Response Time**: <3 seconds average scan-to-result

### User Engagement (Secondary)
- **Daily Active Users**: Target 70% retention after 30 days
- **Scans per Session**: Average 3-5 products per app open
- **Profile Completion**: 90% of users complete dietary restriction setup

### Technical Performance (Supporting)
- **App Store Rating**: Maintain >4.5 stars
- **Crash Rate**: <0.1% of sessions
- **API Uptime**: 99.9% availability for product lookup

## Integration Points

### External APIs
- **Open Food Facts**: Primary product database (world.openfoodfacts.org)
- **Open Beauty Facts**: Beauty products (world.openbeautyfacts.org)
- **Open Pet Food Facts**: Pet food products (world.openpetfoodfacts.org)
- **OpenAI/Anthropic**: Dietary analysis and recommendations

### Platform Features
- **Camera API**: Barcode scanning and image capture
- **Local Storage**: Offline product cache and user data
- **Push Notifications**: Product recalls, dietary alerts
- **Accessibility Services**: VoiceOver, TalkBack integration

This guide should inform all development decisions, feature specifications, and architectural choices for the SMARTIES application.