/**
 * SMARTIES Application Entry Point
 * 
 * This file serves as the main entry point for the SMARTIES application,
 * exporting all major modules and providing a centralized import location.
 */

// Export all screens
export * from './screens';

// Export all components
export * from './components';

// Export all services
export * from './services';

// Export all models
export * from './models';

// Export all utilities
export * from './utils';

// Export all configuration
export * from './config';

// App metadata
export const APP_INFO = {
  name: 'SMARTIES',
  version: '1.0.0',
  description: 'Scan-based Mobile Allergen Risk Tracking & Intelligence Suite',
  buildDate: new Date().toISOString(),
} as const;