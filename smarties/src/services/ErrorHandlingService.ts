/**
 * Comprehensive Error Handling Service
 * Handles network errors, IOExceptions, and provides fallback strategies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface ErrorContext {
  operation: string;
  timestamp: Date;
  userAgent?: string;
  networkStatus?: 'online' | 'offline' | 'unknown';
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle network-related errors including IOException
   */
  async handleNetworkError(error: Error, context: ErrorContext): Promise<void> {
    console.error(`Network Error in ${context.operation}:`, error);

    // Queue error for later retry if offline
    this.errorQueue.push({ error, context });

    // Determine error type and show appropriate message
    if (this.isIOException(error)) {
      await this.handleIOException(error, context);
    } else if (this.isNetworkTimeout(error)) {
      await this.handleTimeoutError(error, context);
    } else if (this.isFetchError(error)) {
      await this.handleFetchError(error, context);
    } else {
      await this.handleGenericError(error, context);
    }
  }

  /**
   * Check if error is IOException
   */
  private isIOException(error: Error): boolean {
    return error.message.includes('IOException') || 
           error.message.includes('Failed to download') ||
           error.message.includes('remote update') ||
           error.name === 'IOException';
  }

  /**
   * Handle IOException specifically
   */
  private async handleIOException(error: Error, context: ErrorContext): Promise<void> {
    console.log('Handling IOException:', error.message);

    // Try to recover from cached data
    const cachedData = await this.getCachedData(context.operation);
    
    if (cachedData) {
      console.log('Using cached data for recovery');
      return;
    }

    // Show user-friendly error message
    Alert.alert(
      'Connection Issue',
      'Unable to download updates. The app will continue with cached data.',
      [
        { text: 'Retry', onPress: () => this.retryOperation(context) },
        { text: 'Continue Offline', style: 'cancel' }
      ]
    );
  }

  /**
   * Handle network timeout errors
   */
  private async handleTimeoutError(error: Error, context: ErrorContext): Promise<void> {
    Alert.alert(
      'Request Timeout',
      'The request is taking longer than expected. Please check your connection.',
      [
        { text: 'Retry', onPress: () => this.retryOperation(context) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  /**
   * Handle fetch API errors
   */
  private async handleFetchError(error: Error, context: ErrorContext): Promise<void> {
    if (error.message.includes('Network request failed')) {
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => this.retryOperation(context) },
          { text: 'Work Offline', style: 'cancel' }
        ]
      );
    }
  }

  /**
   * Handle generic errors
   */
  private async handleGenericError(error: Error, context: ErrorContext): Promise<void> {
    console.error('Generic error:', error);
    
    Alert.alert(
      'Something went wrong',
      'An unexpected error occurred. Please try again.',
      [
        { text: 'Retry', onPress: () => this.retryOperation(context) },
        { text: 'OK', style: 'cancel' }
      ]
    );
  }

  /**
   * Check if error is network timeout
   */
  private isNetworkTimeout(error: Error): boolean {
    return error.message.includes('timeout') || 
           error.message.includes('TIMEOUT') ||
           error.name === 'TimeoutError';
  }

  /**
   * Check if error is fetch-related
   */
  private isFetchError(error: Error): boolean {
    return error instanceof TypeError && 
           (error.message.includes('fetch') || error.message.includes('Network request failed'));
  }

  /**
   * Get cached data for recovery
   */
  private async getCachedData(operation: string): Promise<any> {
    try {
      const cacheKey = `cache_${operation}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error retrieving cached data:', error);
      return null;
    }
  }

  /**
   * Retry failed operation
   */
  private async retryOperation(context: ErrorContext): Promise<void> {
    console.log(`Retrying operation: ${context.operation}`);
    // Implementation depends on the specific operation
    // This would typically involve calling the original function again
  }

  /**
   * Enhanced fetch with error handling
   */
  async safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        await this.handleNetworkError(error, {
          operation: 'fetch',
          timestamp: new Date(),
          networkStatus: 'unknown'
        });
      }
      
      throw error;
    }
  }

  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}