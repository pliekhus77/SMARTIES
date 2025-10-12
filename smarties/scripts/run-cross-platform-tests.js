#!/usr/bin/env node

/**
 * Cross-Platform Test Runner
 * Task 8.4: Execute cross-platform compatibility tests and generate reports
 * 
 * This script runs all cross-platform tests and generates a comprehensive
 * compatibility report for both iOS and Android platforms.
 * 
 * Requirements: 3.5
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

class CrossPlatformTestRunner {
  constructor() {
    this.testResults = {
      platformCompatibility: null,
      uiConsistency: null,
      performanceBenchmarks: null,
      navigationConsistency: null,
    };
    this.startTime = Date.now();
  }

  log(message, color = COLORS.RESET) {
    console.log(`${color}${message}${COLORS.RESET}`);
  }

  logHeader(message) {
    this.log(`\n${COLORS.BOLD}${COLORS.BLUE}=== ${message} ===${COLORS.RESET}`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, COLORS.GREEN);
  }

  logError(message) {
    this.log(`❌ ${message}`, COLORS.RED);
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, COLORS.YELLOW);
  }

  async runTest(testName, testPath) {
    this.log(`\nRunning ${testName}...`);
    
    try {
      const command = `npm test -- --testPathPattern="${testPath}" --verbose --json --outputFile=test-results/${testName}-results.json`;
      
      const output = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Parse test results
      const resultsPath = path.join(process.cwd(), 'test-results', `${testName}-results.json`);
      let results = null;
      
      if (fs.existsSync(resultsPath)) {
        const resultsContent = fs.readFileSync(resultsPath, 'utf8');
        results = JSON.parse(resultsContent);
      }

      this.testResults[testName] = {
        success: true,
        results: results,
        output: output,
        timestamp: new Date().toISOString(),
      };

      this.logSuccess(`${testName} completed successfully`);
      
      if (results) {
        this.log(`  Tests: ${results.numTotalTests || 0} total, ${results.numPassedTests || 0} passed, ${results.numFailedTests || 0} failed`);
      }

      return true;
    } catch (error) {
      this.testResults[testName] = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      this.logError(`${testName} failed: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    this.logHeader('Cross-Platform Compatibility Test Suite');
    
    // Ensure test results directory exists
    const testResultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    const tests = [
      {
        name: 'simplePlatformCompatibility',
        path: '__tests__/cross-platform/SimplePlatformCompatibility.test.tsx',
        description: 'Core platform-specific functionality and adaptation tests',
      },
      {
        name: 'uiConsistency',
        path: '__tests__/cross-platform/UIConsistency.test.tsx',
        description: 'UI consistency and styling tests',
      },
    ];

    let allTestsPassed = true;

    for (const test of tests) {
      this.log(`\n📋 ${test.description}`);
      const success = await this.runTest(test.name, test.path);
      if (!success) {
        allTestsPassed = false;
      }
    }

    return allTestsPassed;
  }

  generateReport() {
    this.logHeader('Generating Cross-Platform Compatibility Report');

    const endTime = Date.now();
    const totalTime = endTime - this.startTime;

    const report = {
      timestamp: new Date().toISOString(),
      totalExecutionTime: `${totalTime}ms`,
      summary: {
        totalTests: Object.keys(this.testResults).length,
        passedTests: Object.values(this.testResults).filter(r => r && r.success).length,
        failedTests: Object.values(this.testResults).filter(r => r && !r.success).length,
      },
      testResults: this.testResults,
      platformInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      recommendations: this.generateRecommendations(),
    };

    // Save detailed JSON report
    const reportPath = path.join(process.cwd(), 'test-results', 'cross-platform-compatibility-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate human-readable report
    this.generateHumanReadableReport(report);

    this.logSuccess(`Report generated: ${reportPath}`);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze test results and generate recommendations
    Object.entries(this.testResults).forEach(([testName, result]) => {
      if (!result || !result.success) {
        recommendations.push({
          category: testName,
          severity: 'high',
          message: `${testName} tests failed. Review implementation for cross-platform compatibility issues.`,
          action: `Investigate and fix issues in ${testName} test suite.`,
        });
      } else if (result.results && result.results.numFailedTests > 0) {
        recommendations.push({
          category: testName,
          severity: 'medium',
          message: `Some ${testName} tests failed. Review specific test failures.`,
          action: `Check individual test failures in ${testName} suite.`,
        });
      }
    });

    // Add general recommendations
    recommendations.push({
      category: 'general',
      severity: 'info',
      message: 'Regularly run cross-platform tests to catch compatibility issues early.',
      action: 'Integrate cross-platform tests into CI/CD pipeline.',
    });

    recommendations.push({
      category: 'performance',
      severity: 'info',
      message: 'Monitor performance benchmarks across different devices and OS versions.',
      action: 'Set up performance monitoring and alerting for production apps.',
    });

    return recommendations;
  }

  generateHumanReadableReport(report) {
    const reportLines = [
      '# Cross-Platform Compatibility Test Report',
      '',
      `**Generated:** ${report.timestamp}`,
      `**Execution Time:** ${report.totalExecutionTime}`,
      '',
      '## Summary',
      '',
      `- **Total Test Suites:** ${report.summary.totalTests}`,
      `- **Passed:** ${report.summary.passedTests}`,
      `- **Failed:** ${report.summary.failedTests}`,
      `- **Success Rate:** ${((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1)}%`,
      '',
      '## Test Results',
      '',
    ];

    // Add detailed results for each test suite
    Object.entries(report.testResults).forEach(([testName, result]) => {
      if (!result) return;
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      reportLines.push(`### ${testName} - ${status}`);
      reportLines.push('');

      if (result.success && result.results) {
        reportLines.push(`- **Total Tests:** ${result.results.numTotalTests || 0}`);
        reportLines.push(`- **Passed:** ${result.results.numPassedTests || 0}`);
        reportLines.push(`- **Failed:** ${result.results.numFailedTests || 0}`);
        reportLines.push(`- **Execution Time:** ${result.results.perfStats?.runtime || 'N/A'}ms`);
      } else if (!result.success) {
        reportLines.push(`- **Error:** ${result.error}`);
      }

      reportLines.push('');
    });

    // Add recommendations
    if (report.recommendations.length > 0) {
      reportLines.push('## Recommendations');
      reportLines.push('');

      report.recommendations.forEach((rec, index) => {
        const severity = rec.severity.toUpperCase();
        const icon = rec.severity === 'high' ? '🔴' : rec.severity === 'medium' ? '🟡' : 'ℹ️';
        
        reportLines.push(`### ${index + 1}. ${icon} ${severity} - ${rec.category}`);
        reportLines.push('');
        reportLines.push(`**Issue:** ${rec.message}`);
        reportLines.push(`**Action:** ${rec.action}`);
        reportLines.push('');
      });
    }

    // Add platform information
    reportLines.push('## Environment Information');
    reportLines.push('');
    reportLines.push(`- **Node Version:** ${report.platformInfo.nodeVersion}`);
    reportLines.push(`- **Platform:** ${report.platformInfo.platform}`);
    reportLines.push(`- **Architecture:** ${report.platformInfo.arch}`);
    reportLines.push('');

    // Save human-readable report
    const readableReportPath = path.join(process.cwd(), 'test-results', 'cross-platform-compatibility-report.md');
    fs.writeFileSync(readableReportPath, reportLines.join('\n'));

    this.logSuccess(`Human-readable report generated: ${readableReportPath}`);
  }

  displaySummary(report) {
    this.logHeader('Test Execution Summary');

    const { summary } = report;
    const successRate = ((summary.passedTests / summary.totalTests) * 100).toFixed(1);

    this.log(`📊 Test Suites: ${summary.totalTests}`);
    this.log(`✅ Passed: ${summary.passedTests}`);
    this.log(`❌ Failed: ${summary.failedTests}`);
    this.log(`📈 Success Rate: ${successRate}%`);
    this.log(`⏱️  Total Time: ${report.totalExecutionTime}`);

    if (summary.failedTests === 0) {
      this.logSuccess('\n🎉 All cross-platform compatibility tests passed!');
      this.log('Your app demonstrates excellent cross-platform consistency.');
    } else {
      this.logWarning(`\n⚠️  ${summary.failedTests} test suite(s) failed.`);
      this.log('Review the detailed report for specific issues and recommendations.');
    }

    // Display high-priority recommendations
    const highPriorityRecs = report.recommendations.filter(r => r.severity === 'high');
    if (highPriorityRecs.length > 0) {
      this.logHeader('High Priority Issues');
      highPriorityRecs.forEach((rec, index) => {
        this.logError(`${index + 1}. ${rec.message}`);
        this.log(`   Action: ${rec.action}`);
      });
    }
  }
}

async function main() {
  const runner = new CrossPlatformTestRunner();

  try {
    // Run all cross-platform tests
    const allTestsPassed = await runner.runAllTests();

    // Generate comprehensive report
    const report = runner.generateReport();

    // Display summary
    runner.displaySummary(report);

    // Exit with appropriate code
    process.exit(allTestsPassed ? 0 : 1);

  } catch (error) {
    runner.logError(`Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { CrossPlatformTestRunner };