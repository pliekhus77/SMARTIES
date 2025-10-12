/**
 * Comprehensive Dietary Analysis Orchestration Service
 * Implements Requirements 5.4, 9.1, 9.2, 9.3, 9.4, 11.5 from vector search specification
 */

import { UPCLookupService } from './search/UPCLookupService';
import { RAGContextService } from './RAGContextService';
import { RAGService, DietaryAnalysisResult } from './RAGService';
import { VectorSearchService } from './search/VectorSearchService';
import { UserProfile, Product } from '../types/core';

export interface ScanAnalysisRequest {
  upc: string;
  userProfile: UserProfile;
  familyProfiles?: UserProfile[];
}

export interface ScanAnalysisResponse {
  product: Product;
  analysis: DietaryAnalysisResult;
  familyAnalysis?: FamilyAnalysisResult[];
  responseTime: number;
  cacheHit: boolean;
}

export interface FamilyAnalysisResult {
  profileId: string;
  profileName: string;
  analysis: DietaryAnalysisResult;
}

export interface CacheEntry {
  key: string;
  data: ScanAnalysisResponse;
  timestamp: Date;
  ttl: number;
}

export class DietaryService {
  private upcLookup: UPCLookupService;
  private ragContext: RAGContextService;
  private ragService: RAGService;
  private vectorSearch: VectorSearchService;
  
  // Multi-level caching
  private sessionCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(
    upcLookup: UPCLookupService,
    vectorSearch: VectorSearchService,
    ragService: RAGService
  ) {
    this.upcLookup = upcLookup;
    this.vectorSearch = vectorSearch;
    this.ragContext = new RAGContextService(vectorSearch);
    this.ragService = ragService;
  }

  /**
   * Complete scan-to-analysis workflow
   */
  async scanAndAnalyze(request: ScanAnalysisRequest): Promise<ScanAnalysisResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check session cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        responseTime: Date.now() - startTime,
        cacheHit: true
      };
    }

    try {
      // Step 1: Product lookup
      const product = await this.upcLookup.lookupByUPC(request.upc);
      if (!product) {
        throw new Error(`Product not found for UPC: ${request.upc}`);
      }

      // Step 2: Primary user analysis
      const primaryAnalysis = await this.analyzeForUser(product, request.userProfile);

      // Step 3: Family analysis (if requested)
      const familyAnalysis = request.familyProfiles 
        ? await this.analyzeFamilyProfiles(product, request.familyProfiles)
        : undefined;

      const response: ScanAnalysisResponse = {
        product,
        analysis: primaryAnalysis,
        familyAnalysis,
        responseTime: Date.now() - startTime,
        cacheHit: false
      };

      // Cache the response
      this.cacheResponse(cacheKey, response);

      return response;
    } catch (error) {
      console.error('Scan and analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze product for single user
   */
  private async analyzeForUser(product: Product, userProfile: UserProfile): Promise<DietaryAnalysisResult> {
    const context = await this.ragContext.buildRAGContext(product, userProfile);
    return await this.ragService.analyzeDietaryCompliance(context);
  }

  /**
   * Analyze product for multiple family members
   */
  private async analyzeFamilyProfiles(product: Product, familyProfiles: UserProfile[]): Promise<FamilyAnalysisResult[]> {
    const results: FamilyAnalysisResult[] = [];

    for (const profile of familyProfiles) {
      try {
        const analysis = await this.analyzeForUser(product, profile);
        results.push({
          profileId: profile.id,
          profileName: profile.name,
          analysis
        });
      } catch (error) {
        console.error(`Family analysis failed for ${profile.name}:`, error);
        results.push({
          profileId: profile.id,
          profileName: profile.name,
          analysis: {
            safetyLevel: 'caution',
            violations: [],
            confidence: 0.1,
            explanation: 'Analysis failed for this family member'
          }
        });
      }
    }

    return results;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: ScanAnalysisRequest): string {
    const profileHash = this.hashUserProfile(request.userProfile);
    const familyHash = request.familyProfiles 
      ? request.familyProfiles.map(p => this.hashUserProfile(p)).join('|')
      : '';
    
    return `${request.upc}:${profileHash}:${familyHash}`;
  }

  /**
   * Hash user profile for caching
   */
  private hashUserProfile(profile: UserProfile): string {
    const restrictions = profile.restrictions
      .map(r => `${r.type}:${r.name}:${r.severity}`)
      .sort()
      .join('|');
    
    return Buffer.from(restrictions).toString('base64').slice(0, 16);
  }

  /**
   * Get response from cache
   */
  private getFromCache(key: string): ScanAnalysisResponse | null {
    const entry = this.sessionCache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.sessionCache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Cache response with TTL
   */
  private cacheResponse(key: string, response: ScanAnalysisResponse): void {
    const entry: CacheEntry = {
      key,
      data: response,
      timestamp: new Date(),
      ttl: this.CACHE_TTL
    };

    this.sessionCache.set(key, entry);

    // Cleanup old entries periodically
    if (this.sessionCache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.sessionCache.entries()) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        this.sessionCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.sessionCache.size,
      hitRate: 0.85 // Placeholder - would track actual hit rate
    };
  }
}
