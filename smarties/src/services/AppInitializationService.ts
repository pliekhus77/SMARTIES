/**
 * App Initialization Service
 * Task 7.1: Create app initialization with database connection
 * 
 * Handles:
 * - Configuration validation
 * - Database connection initialization
 * - App startup sequence
 * 
 * Requirements: 5.1, 5.5
 */

import { DatabaseService } from '../../../src/services/DatabaseService';
import { config } from '../../../src/config/config';

export interface InitializationResult {
  success: boolean;
  error?: string;
  services: {
    database: boolean;
    configuration: boolean;
  };
}

export class AppInitializationService {
  private static instance: AppInitializationService;
  private databaseService: DatabaseService;
  private isInitialized = false;

  private constructor() {
    this.databaseService = new DatabaseService();
  }

  public static getInstance(): AppInitializationService {
    if (!AppInitializationService.instance) {
      AppInitializationService.instance = new AppInitializationService();
    }
    return AppInitializationService.instance;
  }

  /**
   * Initialize the application with all required services
   */
  async initialize(): Promise<InitializationResult> {
    const result: InitializationResult = {
      success: false,
      services: {
        database: false,
        configuration: false,
      },
    };

    try {
      // Step 1: Validate configuration
      await this.validateConfiguration();
      result.services.configuration = true;

      // Step 2: Initialize database connection
      await this.initializeDatabase();
      result.services.database = true;

      this.isInitialized = true;
      result.success = true;

      return result;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown initialization error';
      return result;
    }
  }

  /**
   * Validate app configuration
   */
  private async validateConfiguration(): Promise<void> {
    if (!config.mongodb?.uri) {
      throw new Error('MongoDB URI not configured');
    }

    if (!config.mongodb?.database) {
      throw new Error('MongoDB database name not configured');
    }

    console.log('Configuration validation passed');
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await this.databaseService.connect();
      
      // Perform health check
      const healthStatus = await this.databaseService.performHealthCheck();
      if (healthStatus.status !== 'healthy') {
        throw new Error(`Database health check failed: ${healthStatus.message}`);
      }

      console.log('Database connection initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get database service instance
   */
  getDatabaseService(): DatabaseService {
    if (!this.isInitialized) {
      throw new Error('App not initialized. Call initialize() first.');
    }
    return this.databaseService;
  }

  /**
   * Check if app is initialized
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.databaseService.disconnect();
      this.isInitialized = false;
      console.log('App cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
