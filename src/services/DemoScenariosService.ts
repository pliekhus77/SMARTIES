/**
 * Demo Scenarios Service for Hackathon Presentation
 * Implements Requirements 11.1, 11.2, 11.3, 11.4, 11.5 from vector search specification
 */

import { DietaryService, ScanAnalysisRequest } from './DietaryService';
import { UserProfile, DietaryRestriction } from '../types/core';

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  upc: string;
  userProfile: UserProfile;
  familyProfiles?: UserProfile[];
  expectedOutcome: 'safe' | 'caution' | 'danger';
  keyFeatures: string[];
}

export interface DemoResult {
  scenario: DemoScenario;
  result: any;
  executionTime: number;
  success: boolean;
}

export class DemoScenariosService {
  private dietaryService: DietaryService;
  private scenarios: DemoScenario[];

  constructor(dietaryService: DietaryService) {
    this.dietaryService = dietaryService;
    this.scenarios = this.initializeDemoScenarios();
  }

  /**
   * Execute all demo scenarios
   */
  async executeAllScenarios(): Promise<DemoResult[]> {
    const results: DemoResult[] = [];

    for (const scenario of this.scenarios) {
      try {
        const result = await this.executeScenario(scenario);
        results.push(result);
      } catch (error) {
        console.error(`Demo scenario ${scenario.id} failed:`, error);
        results.push({
          scenario,
          result: null,
          executionTime: 0,
          success: false
        });
      }
    }

    return results;
  }

  /**
   * Execute single demo scenario
   */
  async executeScenario(scenario: DemoScenario): Promise<DemoResult> {
    const startTime = Date.now();

    const request: ScanAnalysisRequest = {
      upc: scenario.upc,
      userProfile: scenario.userProfile,
      familyProfiles: scenario.familyProfiles
    };

    const result = await this.dietaryService.scanAndAnalyze(request);
    const executionTime = Date.now() - startTime;

    return {
      scenario,
      result,
      executionTime,
      success: true
    };
  }

  /**
   * Get scenario by ID
   */
  getScenario(id: string): DemoScenario | undefined {
    return this.scenarios.find(s => s.id === id);
  }

  /**
   * Initialize demo scenarios
   */
  private initializeDemoScenarios(): DemoScenario[] {
    return [
      {
        id: 'peanut-allergy-danger',
        name: 'Severe Peanut Allergy - Dangerous Product',
        description: 'User with severe peanut allergy scans peanut butter',
        upc: '123456789012',
        userProfile: this.createUserProfile('Alice', [
          { type: 'peanuts', name: 'Peanut Allergy', severity: 'high', notes: 'Severe anaphylactic reaction' }
        ]),
        expectedOutcome: 'danger',
        keyFeatures: ['Allergen Detection', 'Safety-First Logic', 'Confidence Scoring']
      },
      {
        id: 'multi-restriction-complex',
        name: 'Multi-Restriction Complex Analysis',
        description: 'User with allergies + religious + lifestyle restrictions',
        upc: '234567890123',
        userProfile: this.createUserProfile('Bob', [
          { type: 'milk', name: 'Dairy Allergy', severity: 'medium', notes: 'Lactose intolerant' },
          { type: 'halal', name: 'Halal Diet', severity: 'high', notes: 'Strict religious requirement' },
          { type: 'vegan', name: 'Vegan Lifestyle', severity: 'medium', notes: 'Ethical choice' }
        ]),
        expectedOutcome: 'caution',
        keyFeatures: ['Multi-Restriction Analysis', 'Religious Compliance', 'Lifestyle Preferences']
      },
      {
        id: 'family-household-analysis',
        name: 'Family Household Analysis',
        description: 'Analyze product for entire family with different restrictions',
        upc: '345678901234',
        userProfile: this.createUserProfile('Parent', [
          { type: 'diabetes', name: 'Type 2 Diabetes', severity: 'high', notes: 'Blood sugar management' }
        ]),
        familyProfiles: [
          this.createUserProfile('Child1', [
            { type: 'peanuts', name: 'Peanut Allergy', severity: 'high', notes: 'School requires EpiPen' }
          ]),
          this.createUserProfile('Child2', [
            { type: 'gluten', name: 'Celiac Disease', severity: 'high', notes: 'Diagnosed celiac' }
          ])
        ],
        expectedOutcome: 'caution',
        keyFeatures: ['Family Analysis', 'Multi-User Profiles', 'Household Management']
      },
      {
        id: 'confidence-uncertainty',
        name: 'Confidence Scoring with Uncertainty',
        description: 'Product with incomplete data showing uncertainty handling',
        upc: '456789012345',
        userProfile: this.createUserProfile('Charlie', [
          { type: 'shellfish', name: 'Shellfish Allergy', severity: 'high', notes: 'All shellfish types' }
        ]),
        expectedOutcome: 'caution',
        keyFeatures: ['Confidence Scoring', 'Uncertainty Communication', 'Safety-First Logic']
      },
      {
        id: 'alternative-recommendations',
        name: 'AI-Powered Alternative Recommendations',
        description: 'Show safer alternatives for restricted product',
        upc: '567890123456',
        userProfile: this.createUserProfile('Diana', [
          { type: 'vegan', name: 'Vegan Diet', severity: 'high', notes: 'Strict vegan' },
          { type: 'organic', name: 'Organic Only', severity: 'medium', notes: 'Prefers organic' }
        ]),
        expectedOutcome: 'danger',
        keyFeatures: ['Alternative Recommendations', 'Vector Similarity', 'Personalized Suggestions']
      },
      {
        id: 'cross-contamination-detection',
        name: 'Cross-Contamination Detection',
        description: 'Detect hidden allergens and manufacturing warnings',
        upc: '678901234567',
        userProfile: this.createUserProfile('Eve', [
          { type: 'tree-nuts', name: 'Tree Nut Allergy', severity: 'high', notes: 'All tree nuts' }
        ]),
        expectedOutcome: 'caution',
        keyFeatures: ['Cross-Contamination Analysis', 'Hidden Allergens', 'Manufacturing Warnings']
      }
    ];
  }

  /**
   * Create user profile for demo
   */
  private createUserProfile(name: string, restrictions: Array<{
    type: string;
    name: string;
    severity: 'low' | 'medium' | 'high';
    notes: string;
  }>): UserProfile {
    return {
      id: `demo-${name.toLowerCase()}`,
      name,
      restrictions: restrictions.map(r => ({
        type: r.type,
        name: r.name,
        severity: r.severity,
        notes: r.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate demo presentation summary
   */
  generatePresentationSummary(results: DemoResult[]): string {
    const successful = results.filter(r => r.success).length;
    const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
    
    return `
SMARTIES Demo Results Summary
============================

Total Scenarios: ${results.length}
Successful: ${successful}
Average Response Time: ${avgTime.toFixed(0)}ms

Key Features Demonstrated:
- Real-time UPC scanning and analysis
- Multi-restriction dietary compliance
- Family profile management
- AI-powered alternative recommendations
- Confidence scoring and uncertainty handling
- Cross-contamination detection

Performance Metrics:
- Sub-3-second response time: ${results.filter(r => r.executionTime < 3000).length}/${results.length}
- Safety-first decision making
- Comprehensive allergen detection
`;
  }
}
