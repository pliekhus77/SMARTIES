/**
 * Dietary analysis service with AI fallback logic
 * Coordinates between OpenAI and Anthropic services
 */

import { OpenAIService, DietaryAnalysisRequest, DietaryAnalysisResponse } from './openai';
import { AnthropicService } from './anthropic';

export interface ServiceStatus {
  openai: boolean;
  anthropic: boolean;
  lastChecked: Date;
}

export interface AnalysisOptions {
  retryAttempts?: number;
  retryDelay?: number;
  skipFallback?: boolean;
  forceService?: 'openai' | 'anthropic';
}

export class DietaryAnalysisService {
  private openAIService: OpenAIService;
  private anthropicService: AnthropicService;
  private serviceStatus: ServiceStatus;
  private rateLimitTracker: Map<string, { count: number; resetTime: number }>;

  constructor(openAIService: OpenAIService, anthropicService: AnthropicService) {
    this.openAIService = openAIService;
    this.anthropicService = anthropicService;
    this.serviceStatus = {
      openai: true,
      anthropic: true,
      lastChecked: new Date()
    };
    this.rateLimitTracker = new Map();
  }

  /**
   * Analyze product with automatic fallback and rate limiting
   */
  async analyzeProduct(request: DietaryAnalysisRequest, options: AnalysisOptions = {}): Promise<DietaryAnalysisResponse> {
    const {
      retryAttempts = 2,
      retryDelay = 1000,
      skipFallback = false,
      forceService
    } = options;

    // Check rate limits
    if (this.isRateLimited('openai') && this.isRateLimited('anthropic')) {
      console.warn('Both services rate limited, using fallback analysis');
      return this.basicRuleBasedAnalysis(request);
    }

    let lastError: Error | null = null;

    // Try forced service if specified
    if (forceService) {
      try {
        return await this.callService(forceService, request, retryAttempts, retryDelay);
      } catch (error) {
        lastError = error as Error;
        if (skipFallback) {
          throw error;
        }
      }
    }

    // Try OpenAI first (if not rate limited and not forced to use Anthropic)
    if (!forceService || forceService === 'openai') {
      if (!this.isRateLimited('openai') && this.serviceStatus.openai) {
        try {
          const result = await this.callService('openai', request, retryAttempts, retryDelay);
          this.updateServiceStatus('openai', true);
          return result;
        } catch (openAIError) {
          lastError = openAIError as Error;
          console.warn('OpenAI analysis failed:', openAIError);
          this.updateServiceStatus('openai', false);
          
          if (skipFallback) {
            throw openAIError;
          }
        }
      }
    }

    // Fallback to Anthropic
    if (!forceService || forceService === 'anthropic') {
      if (!this.isRateLimited('anthropic') && this.serviceStatus.anthropic) {
        try {
          const result = await this.callService('anthropic', request, retryAttempts, retryDelay);
          this.updateServiceStatus('anthropic', true);
          return result;
        } catch (anthropicError) {
          lastError = anthropicError as Error;
          console.warn('Anthropic analysis failed:', anthropicError);
          this.updateServiceStatus('anthropic', false);
          
          if (skipFallback) {
            throw anthropicError;
          }
        }
      }
    }

    console.error('Both AI services failed:', lastError);
    
    // Final fallback to basic rule-based analysis
    return this.basicRuleBasedAnalysis(request);
  }

  /**
   * Test service connectivity
   */
  async testServices(): Promise<ServiceStatus> {
    const [openaiStatus, anthropicStatus] = await Promise.allSettled([
      this.openAIService.testConnection(),
      this.anthropicService.testConnection()
    ]);

    this.serviceStatus = {
      openai: openaiStatus.status === 'fulfilled' && openaiStatus.value,
      anthropic: anthropicStatus.status === 'fulfilled' && anthropicStatus.value,
      lastChecked: new Date()
    };

    return this.serviceStatus;
  }

  /**
   * Get current service status
   */
  getServiceStatus(): ServiceStatus {
    return { ...this.serviceStatus };
  }

  /**
   * Call specific AI service with retry logic
   */
  private async callService(
    service: 'openai' | 'anthropic',
    request: DietaryAnalysisRequest,
    retryAttempts: number,
    retryDelay: number
  ): Promise<DietaryAnalysisResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        this.trackRateLimit(service);
        
        if (service === 'openai') {
          return await this.openAIService.analyzeDietaryCompliance(request);
        } else {
          return await this.anthropicService.analyzeDietaryCompliance(request);
        }
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a rate limit error
        if (this.isRateLimitError(error)) {
          this.setRateLimited(service);
          throw error;
        }

        // Wait before retry (except on last attempt)
        if (attempt < retryAttempts) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error(`${service} service failed after ${retryAttempts + 1} attempts`);
  }

  /**
   * Basic rule-based analysis as final fallback
   */
  private basicRuleBasedAnalysis(request: DietaryAnalysisRequest): DietaryAnalysisResponse {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Simple allergen detection
    const ingredients = request.ingredients.join(' ').toLowerCase();
    
    // Common allergen mappings
    const allergenMappings: Record<string, string[]> = {
      'milk': ['milk', 'dairy', 'lactose', 'casein', 'whey'],
      'eggs': ['egg', 'albumin', 'lecithin'],
      'peanuts': ['peanut', 'groundnut'],
      'tree nuts': ['almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'pistachio'],
      'soy': ['soy', 'soya', 'tofu', 'tempeh'],
      'wheat': ['wheat', 'gluten', 'flour'],
      'fish': ['fish', 'salmon', 'tuna', 'cod'],
      'shellfish': ['shrimp', 'crab', 'lobster', 'shellfish']
    };

    request.userRestrictions.forEach(restriction => {
      const restrictionLower = restriction.toLowerCase();
      const searchTerms = allergenMappings[restrictionLower] || [restrictionLower];
      
      const found = searchTerms.some(term => ingredients.includes(term));
      if (found) {
        violations.push(restriction);
      }
    });

    return {
      safe: violations.length === 0,
      violations,
      warnings,
      confidence: 0.7, // Lower confidence for rule-based analysis
      explanation: 'Basic rule-based analysis (AI services unavailable)'
    };
  }

  /**
   * Check if service is rate limited
   */
  private isRateLimited(service: string): boolean {
    const tracker = this.rateLimitTracker.get(service);
    if (!tracker) return false;
    
    return Date.now() < tracker.resetTime;
  }

  /**
   * Track rate limit usage
   */
  private trackRateLimit(service: string): void {
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(service);
    
    if (!tracker || now >= tracker.resetTime) {
      this.rateLimitTracker.set(service, {
        count: 1,
        resetTime: now + 60000 // Reset after 1 minute
      });
    } else {
      tracker.count++;
    }
  }

  /**
   * Set service as rate limited
   */
  private setRateLimited(service: string): void {
    this.rateLimitTracker.set(service, {
      count: 999,
      resetTime: Date.now() + 60000 // Rate limited for 1 minute
    });
  }

  /**
   * Check if error is rate limit related
   */
  private isRateLimitError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return errorMessage.includes('rate limit') || 
           errorMessage.includes('too many requests') ||
           error?.status === 429;
  }

  /**
   * Update service status
   */
  private updateServiceStatus(service: 'openai' | 'anthropic', status: boolean): void {
    this.serviceStatus[service] = status;
    this.serviceStatus.lastChecked = new Date();
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}