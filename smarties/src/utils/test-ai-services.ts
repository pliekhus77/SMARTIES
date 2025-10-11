/**
 * AI Services Test Utility
 * Utility script to test AI service configuration and connectivity
 */

import { testAIServices, createDietaryAnalysisService } from '../services/ai';
import { DietaryAnalysisRequest } from '../services/ai/openai';

/**
 * Test AI service configuration and basic functionality
 */
export async function runAIServiceTests(): Promise<void> {
  console.log('🧪 Testing AI Service Configuration...\n');

  // Test service configuration
  const configTest = await testAIServices();
  
  console.log('📋 Configuration Status:');
  console.log(`  ✅ Configured: ${configTest.configured}`);
  console.log(`  🤖 OpenAI Working: ${configTest.openaiWorking}`);
  console.log(`  🧠 Anthropic Working: ${configTest.anthropicWorking}`);
  
  if (configTest.errors.length > 0) {
    console.log('\n❌ Configuration Errors:');
    configTest.errors.forEach(error => console.log(`  - ${error}`));
  }

  // Test dietary analysis service
  console.log('\n🔬 Testing Dietary Analysis Service...');
  
  const service = createDietaryAnalysisService();
  
  // Test basic functionality with sample data
  const testRequest: DietaryAnalysisRequest = {
    productName: 'Test Chocolate Bar',
    ingredients: ['milk chocolate', 'sugar', 'cocoa butter', 'soy lecithin'],
    userRestrictions: ['dairy', 'soy'],
    strictMode: true
  };

  try {
    const result = await service.analyzeProduct(testRequest);
    
    console.log('✅ Analysis completed successfully:');
    console.log(`  Safe: ${result.safe}`);
    console.log(`  Violations: ${result.violations.join(', ') || 'None'}`);
    console.log(`  Warnings: ${result.warnings.join(', ') || 'None'}`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Explanation: ${result.explanation}`);
    
  } catch (error) {
    console.log('❌ Analysis failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Test service status
  console.log('\n📊 Service Status:');
  const status = service.getServiceStatus();
  console.log(`  OpenAI: ${status.openai ? '✅ Available' : '❌ Unavailable'}`);
  console.log(`  Anthropic: ${status.anthropic ? '✅ Available' : '❌ Unavailable'}`);
  console.log(`  Last Checked: ${status.lastChecked.toISOString()}`);

  console.log('\n🎉 AI Service tests completed!');
}

/**
 * Test specific scenarios for dietary analysis
 */
export async function runDietaryAnalysisTests(): Promise<void> {
  console.log('🧪 Testing Dietary Analysis Scenarios...\n');

  const service = createDietaryAnalysisService();

  const testCases: Array<{
    name: string;
    request: DietaryAnalysisRequest;
    expectedSafe: boolean;
  }> = [
    {
      name: 'Safe product for dairy-free user',
      request: {
        productName: 'Apple',
        ingredients: ['apple'],
        userRestrictions: ['dairy'],
        strictMode: true
      },
      expectedSafe: true
    },
    {
      name: 'Unsafe product for dairy-free user',
      request: {
        productName: 'Milk Chocolate',
        ingredients: ['milk', 'sugar', 'cocoa'],
        userRestrictions: ['dairy'],
        strictMode: true
      },
      expectedSafe: false
    },
    {
      name: 'Multiple allergens',
      request: {
        productName: 'Peanut Butter Cookie',
        ingredients: ['wheat flour', 'peanuts', 'eggs', 'butter'],
        userRestrictions: ['peanuts', 'eggs'],
        strictMode: true
      },
      expectedSafe: false
    },
    {
      name: 'No restrictions',
      request: {
        productName: 'Mixed Nuts',
        ingredients: ['peanuts', 'almonds', 'cashews'],
        userRestrictions: [],
        strictMode: false
      },
      expectedSafe: true
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    
    try {
      const result = await service.analyzeProduct(testCase.request);
      const passed = result.safe === testCase.expectedSafe;
      
      console.log(`  ${passed ? '✅' : '❌'} Expected safe: ${testCase.expectedSafe}, Got: ${result.safe}`);
      if (result.violations.length > 0) {
        console.log(`  Violations: ${result.violations.join(', ')}`);
      }
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.log(`  ❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('');
  }

  console.log('🎉 Dietary analysis tests completed!');
}

// Export for use in other modules
export { testAIServices, createDietaryAnalysisService };