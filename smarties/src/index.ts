/**
 * SMARTIES Application Entry Point
 * 
 * This file serves as the main entry point for the SMARTIES application,
 * exporting all major modules and providing a centralized import location.
 */

// Export screens
export * from './screens';

// Export components
export * from './components';

// Export models
export * from './models';

// Export services (specific exports to avoid conflicts)
export { DatabaseService } from './services/atlas';
export { OpenAIService, AnthropicService, DietaryAnalysisService } from './services/ai';
export { BarcodeScanner, ProductLookupService } from './services/barcode';
export { DietaryComplianceChecker } from './services/dietary';

// Export utilities (specific exports to avoid conflicts)
export { validateUPC, validateEmail, validateDietaryRestriction } from './utils/validation';
export { formatUPC, formatDate, formatNutritionalValue, truncateText, capitalizeWords } from './utils/formatting';
export { detectAllergens, containsAllergen, getAllergenSeverity } from './utils/allergenDetection';
export { checkMedicalCompliance, calculateNutritionalRisk } from './utils/medicalChecks';
export { checkReligiousCompliance as checkReligiousComplianceUtil } from './utils/religiousCompliance';

// Export configuration
export * from './config';

// Export types
export * from './types';

// App metadata
export const APP_INFO = {
  name: 'SMARTIES',
  version: '1.0.0',
  description: 'Scan-based Mobile Allergen Risk Tracking & Intelligence Suite',
  buildDate: new Date().toISOString(),
} as const;