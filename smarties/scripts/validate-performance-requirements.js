#!/usr/bin/env node

/**
 * Performance Requirements Validation Script
 * Task 8.3: Validate performance requirements
 * 
 * Validates that all performance requirements from Requirement 2.5 are met
 * Requirements: 2.5
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Performance requirements from specification
const REQUIREMENTS = {
  '2.5': {
    description: 'Sub-100ms query response times for indexed fields',
    thresholds: {
      databaseQuery: 100, // ms
      productLookup: 100, // ms
      userProfileLookup: 100, // ms
      scanHistoryQuery: 100, // ms
      allergenFiltering: 100, // ms
      healthCheck: 100 // ms
    }
  }
};

// Additional performance targets from design
const PERFORMANCE_TARGETS = {
  appStartup: 2000, // ms - App startup time
  navigationResponse: 200, // ms - Navigation responsiveness
  memoryUsage: 100 * 1024 * 1024, // 100MB - Memory usage limit
  connectionTime: 1000, // ms - Database connection time
  tabSwitch: 100 // ms - Tab switching time
};

class PerformanceValidator {
  constructor() {
    this.validationResults = [];
    this.overallStatus = 'UNKNOWN';
  }

  async validateAllRequirements() {
    console.log('🔍 Validating Performance Requirements');
    console.log('=====================================\n');

    // Run performance tests
    console.log('📊 Running performance tests...');
    await this.runPerformanceTests();

    // Validate specific requirements
    await this.validateRequirement25();

    // Generate validation report
    this.generateValidationReport();

    return this.overallStatus === 'PASSED';
  }

  async runPerformanceTests() {
    try {
      // Run all performance tests
      execSync('npm run test:performance', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Performance tests completed successfully\n');
    } catch (error) {
      console.log('❌ Performance tests failed\n');
      throw error;
    }
  }

  async validateRequirement25() {
    console.log('🎯 Validating Requirement 2.5: Sub-100ms Query Response Times');
    console.log('==============================================================\n');

    const requirement = REQUIREMENTS['2.5'];
    const validationResults = [];

    // Check if performance report exists
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    if (!fs.existsSync(reportPath)) {
      console.log('❌ Performance report not found. Run performance tests first.');
      this.validationResults.push({
        requirement: '2.5',
        status: 'FAILED',
        reason: 'Performance report not found'
      });
      return;
    }

    // Load performance report
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    // Find database performance test results
    const dbTest = report.results.find(r => r.name === 'Database Performance');
    
    if (!dbTest) {
      console.log('❌ Database performance test results not found');
      this.validationResults.push({
        requirement: '2.5',
        status: 'FAILED',
        reason: 'Database performance test results not found'
      });
      return;
    }

    if (dbTest.status !== 'PASSED') {
      console.log('❌ Database performance tests failed');
      this.validationResults.push({
        requirement: '2.5',
        status: 'FAILED',
        reason: 'Database performance tests failed',
        details: dbTest.error
      });
      return;
    }

    // Validate each threshold
    let allThresholdsMet = true;
    const thresholdResults = [];

    Object.entries(requirement.thresholds).forEach(([metric, threshold]) => {
      const metricKey = this.findMetricKey(dbTest.metrics, metric);
      
      if (metricKey && dbTest.metrics[metricKey] !== undefined) {
        const actualValue = dbTest.metrics[metricKey];
        const passed = actualValue <= threshold;
        
        thresholdResults.push({
          metric,
          threshold,
          actualValue,
          passed,
          percentage: Math.round((actualValue / threshold) * 100)
        });

        if (!passed) {
          allThresholdsMet = false;
        }

        const status = passed ? '✅' : '❌';
        console.log(`${status} ${metric}: ${actualValue}ms (threshold: ${threshold}ms, ${Math.round((actualValue / threshold) * 100)}%)`);
      } else {
        console.log(`⚠️ ${metric}: No data available`);
        thresholdResults.push({
          metric,
          threshold,
          actualValue: null,
          passed: false,
          reason: 'No data available'
        });
        allThresholdsMet = false;
      }
    });

    // Overall requirement status
    const requirementStatus = allThresholdsMet ? 'PASSED' : 'FAILED';
    console.log(`\n${requirementStatus === 'PASSED' ? '✅' : '❌'} Requirement 2.5: ${requirementStatus}`);

    this.validationResults.push({
      requirement: '2.5',
      description: requirement.description,
      status: requirementStatus,
      thresholds: thresholdResults,
      summary: {
        total: thresholdResults.length,
        passed: thresholdResults.filter(r => r.passed).length,
        failed: thresholdResults.filter(r => !r.passed).length
      }
    });

    console.log('');
  }

  findMetricKey(metrics, searchTerm) {
    const keys = Object.keys(metrics);
    const searchLower = searchTerm.toLowerCase();
    
    // Direct mapping
    const mappings = {
      'databaseQuery': ['database', 'query', 'response'],
      'productLookup': ['product', 'lookup', 'upc'],
      'userProfileLookup': ['user', 'profile', 'lookup'],
      'scanHistoryQuery': ['scan', 'history', 'query'],
      'allergenFiltering': ['allergen', 'filtering'],
      'healthCheck': ['health', 'check']
    };

    if (mappings[searchTerm]) {
      const searchTerms = mappings[searchTerm];
      return keys.find(key => 
        searchTerms.every(term => key.toLowerCase().includes(term))
      );
    }

    // Fallback: find key containing search term
    return keys.find(key => key.toLowerCase().includes(searchLower));
  }

  generateValidationReport() {
    console.log('📋 Performance Requirements Validation Summary');
    console.log('==============================================\n');

    const totalRequirements = this.validationResults.length;
    const passedRequirements = this.validationResults.filter(r => r.status === 'PASSED').length;
    const failedRequirements = this.validationResults.filter(r => r.status === 'FAILED').length;

    console.log(`Total Requirements Validated: ${totalRequirements}`);
    console.log(`Passed: ${passedRequirements}`);
    console.log(`Failed: ${failedRequirements}`);

    this.overallStatus = failedRequirements === 0 ? 'PASSED' : 'FAILED';
    console.log(`\nOverall Status: ${this.overallStatus === 'PASSED' ? '✅' : '❌'} ${this.overallStatus}\n`);

    // Detailed results
    this.validationResults.forEach(result => {
      console.log(`${result.status === 'PASSED' ? '✅' : '❌'} Requirement ${result.requirement}: ${result.status}`);
      console.log(`   ${result.description}`);
      
      if (result.summary) {
        console.log(`   Thresholds: ${result.summary.passed}/${result.summary.total} passed`);
      }
      
      if (result.reason) {
        console.log(`   Reason: ${result.reason}`);
      }
      
      console.log('');
    });

    // Performance recommendations
    this.generateRecommendations();

    // Save validation report
    this.saveValidationReport();
  }

  generateRecommendations() {
    console.log('💡 Performance Optimization Recommendations');
    console.log('===========================================\n');

    const failedResults = this.validationResults.filter(r => r.status === 'FAILED');
    
    if (failedResults.length === 0) {
      console.log('✅ All performance requirements met! No optimizations needed.\n');
      return;
    }

    failedResults.forEach(result => {
      console.log(`📌 Requirement ${result.requirement} - ${result.description}`);
      
      if (result.thresholds) {
        const failedThresholds = result.thresholds.filter(t => !t.passed);
        
        failedThresholds.forEach(threshold => {
          console.log(`   ⚠️ ${threshold.metric}: ${threshold.actualValue}ms > ${threshold.threshold}ms`);
          
          // Specific recommendations based on metric type
          const recommendations = this.getRecommendations(threshold.metric, threshold.actualValue, threshold.threshold);
          recommendations.forEach(rec => {
            console.log(`      💡 ${rec}`);
          });
        });
      }
      
      console.log('');
    });
  }

  getRecommendations(metric, actualValue, threshold) {
    const recommendations = [];
    const overage = actualValue - threshold;
    const overagePercent = Math.round((overage / threshold) * 100);

    switch (metric) {
      case 'databaseQuery':
      case 'productLookup':
      case 'userProfileLookup':
        recommendations.push('Ensure proper database indexes are created');
        recommendations.push('Consider connection pooling optimization');
        recommendations.push('Review query complexity and optimize if needed');
        if (overagePercent > 50) {
          recommendations.push('Consider implementing query result caching');
        }
        break;

      case 'scanHistoryQuery':
        recommendations.push('Implement compound indexes on userId + scanTimestamp');
        recommendations.push('Consider pagination for large result sets');
        recommendations.push('Add query result caching for recent scans');
        break;

      case 'allergenFiltering':
        recommendations.push('Optimize allergen array indexing');
        recommendations.push('Consider pre-computed allergen flags');
        recommendations.push('Implement allergen lookup caching');
        break;

      case 'healthCheck':
        recommendations.push('Optimize health check query complexity');
        recommendations.push('Consider lightweight ping instead of full health check');
        recommendations.push('Implement health check result caching');
        break;

      default:
        recommendations.push('Review and optimize the specific operation');
        recommendations.push('Consider implementing caching strategies');
        recommendations.push('Analyze and optimize database queries');
    }

    return recommendations;
  }

  saveValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overallStatus: this.overallStatus,
      requirements: REQUIREMENTS,
      performanceTargets: PERFORMANCE_TARGETS,
      validationResults: this.validationResults,
      summary: {
        total: this.validationResults.length,
        passed: this.validationResults.filter(r => r.status === 'PASSED').length,
        failed: this.validationResults.filter(r => r.status === 'FAILED').length
      }
    };

    const reportPath = path.join(process.cwd(), 'performance-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Validation report saved: ${reportPath}`);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PerformanceValidator();
  
  validator.validateAllRequirements()
    .then(success => {
      if (success) {
        console.log('\n🎉 All performance requirements validated successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Performance requirements validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Performance validation failed with error:', error.message);
      process.exit(1);
    });
}

module.exports = PerformanceValidator;