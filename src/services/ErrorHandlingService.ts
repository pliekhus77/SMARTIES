/**
 * Comprehensive Error Handling Service
 * Implements Requirements 1.3, 1.4, 1.5, 2.5 from SMARTIES API integration specification
 */

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  recoveryActions: RecoveryAction[];
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface RecoveryAction {
  label: string;
  action: () => Promise<void> | void;
  primary?: boolean;
}

export class ErrorHandlingService {
  /**
   * Handle and categorize errors
   */
  static handleError(error: any, context?: string): ErrorInfo {
    const errorInfo = this.categorizeError(error);
    
    // Log error for monitoring
    console.error(`[${context || 'Unknown'}] ${errorInfo.type}:`, error);
    
    return errorInfo;
  }

  /**
   * Categorize error by type
   */
  private static categorizeError(error: any): ErrorInfo {
    if (this.isNetworkError(error)) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: error.message || 'Network connection failed',
        userMessage: 'Unable to connect to the internet. Please check your connection.',
        recoveryActions: [
          { label: 'Retry', action: () => {}, primary: true },
          { label: 'Use Offline Mode', action: () => {} }
        ],
        severity: 'medium',
        timestamp: new Date()
      };
    }

    if (this.isAPIError(error)) {
      return {
        type: ErrorType.API_ERROR,
        message: error.message || 'API request failed',
        userMessage: 'Service temporarily unavailable. Please try again.',
        recoveryActions: [
          { label: 'Retry', action: () => {}, primary: true },
          { label: 'Report Issue', action: () => {} }
        ],
        severity: 'high',
        timestamp: new Date()
      };
    }

    if (this.isAnalysisError(error)) {
      return {
        type: ErrorType.ANALYSIS_ERROR,
        message: error.message || 'Analysis failed',
        userMessage: 'Unable to analyze this product. Please review manually.',
        recoveryActions: [
          { label: 'Try Again', action: () => {}, primary: true },
          { label: 'Manual Review', action: () => {} }
        ],
        severity: 'medium',
        timestamp: new Date()
      };
    }

    // Default unknown error
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred',
      userMessage: 'Something went wrong. Please try again.',
      recoveryActions: [
        { label: 'Retry', action: () => {}, primary: true },
        { label: 'Contact Support', action: () => {} }
      ],
      severity: 'medium',
      timestamp: new Date()
    };
  }

  /**
   * Check if error is network-related
   */
  private static isNetworkError(error: any): boolean {
    return (
      error.code === 'NETWORK_ERROR' ||
      error.message?.includes('network') ||
      error.message?.includes('fetch') ||
      !navigator.onLine
    );
  }

  /**
   * Check if error is API-related
   */
  private static isAPIError(error: any): boolean {
    return (
      error.status >= 400 ||
      error.code === 'API_ERROR' ||
      error.message?.includes('API')
    );
  }

  /**
   * Check if error is analysis-related
   */
  private static isAnalysisError(error: any): boolean {
    return (
      error.code === 'ANALYSIS_ERROR' ||
      error.message?.includes('analysis') ||
      error.message?.includes('allergen')
    );
  }

  /**
   * Create fallback response for failed operations
   */
  static createFallbackResponse(operation: string): any {
    switch (operation) {
      case 'product_search':
        return {
          product: null,
          fromCache: false,
          error: 'Product search failed - please try manual entry'
        };
      
      case 'allergen_analysis':
        return {
          severity: 'mild',
          violations: [],
          riskLevel: 'Unknown Risk',
          recommendations: [
            'Unable to complete analysis',
            'Please review ingredients manually',
            'Consult healthcare provider if unsure'
          ]
        };
      
      default:
        return {
          success: false,
          error: 'Operation failed - please try again'
        };
    }
  }

  /**
   * Implement retry logic with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if operation should be retried
   */
  static shouldRetry(error: any): boolean {
    const errorInfo = this.categorizeError(error);
    
    // Don't retry validation errors or permission errors
    if (errorInfo.type === ErrorType.VALIDATION_ERROR || 
        errorInfo.type === ErrorType.PERMISSION_ERROR) {
      return false;
    }

    // Retry network and API errors
    return errorInfo.type === ErrorType.NETWORK_ERROR || 
           errorInfo.type === ErrorType.API_ERROR;
  }
}
