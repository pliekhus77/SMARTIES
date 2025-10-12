/**
 * Cross-Platform Test Results Processor
 * Task 8.4: Process and format cross-platform test results
 * 
 * This processor handles the formatting and analysis of Jest test results
 * specifically for cross-platform compatibility testing.
 * 
 * Requirements: 3.5
 */

const fs = require('fs');
const path = require('path');

/**
 * Process Jest test results for cross-platform analysis
 * @param {Object} testResults - Jest test results object
 * @returns {Object} Processed results with cross-platform insights
 */
function processResults(testResults) {
  const processedResults = {
    summary: extractSummary(testResults),
    platformBreakdown: analyzePlatformResults(testResults),
    performanceMetrics: extractPerformanceMetrics(testResults),
    failureAnalysis: analyzeFailures(testResults),
    recommendations: generateRecommendations(testResults),
    timestamp: new Date().toISOString(),
  };

  // Save processed results
  saveProcessedResults(processedResults);

  return processedResults;
}

/**
 * Extract summary statistics from test results
 */
function extractSummary(testResults) {
  return {
    numTotalTestSuites: testResults.numTotalTestSuites,
    numPassedTestSuites: testResults.numPassedTestSuites,
    numFailedTestSuites: testResults.numFailedTestSuites,
    numTotalTests: testResults.numTotalTests,
    numPassedTests: testResults.numPassedTests,
    numFailedTests: testResults.numFailedTests,
    numPendingTests: testResults.numPendingTests,
    testRunTime: testResults.runTime,
    success: testResults.success,
  };
}

/**
 * Analyze results by platform
 */
function analyzePlatformResults(testResults) {
  const platformBreakdown = {
    ios: { tests: 0, passed: 0, failed: 0, pending: 0 },
    android: { tests: 0, passed: 0, failed: 0, pending: 0 },
    crossPlatform: { tests: 0, passed: 0, failed: 0, pending: 0 },
  };

  testResults.testResults.forEach(testSuite => {
    testSuite.testResults.forEach(test => {
      const platform = determinePlatform(test.fullName);
      
      platformBreakdown[platform].tests++;
      
      if (test.status === 'passed') {
        platformBreakdown[platform].passed++;
      } else if (test.status === 'failed') {
        platformBreakdown[platform].failed++;
      } else if (test.status === 'pending') {
        platformBreakdown[platform].pending++;
      }
    });
  });

  return platformBreakdown;
}

/**
 * Determine platform from test name
 */
function determinePlatform(testName) {
  const lowerName = testName.toLowerCase();
  
  if (lowerName.includes('ios')) {
    return 'ios';
  } else if (lowerName.includes('android')) {
    return 'android';
  }
  
  return 'crossPlatform';
}

/**
 * Extract performance metrics from test results
 */
function extractPerformanceMetrics(testResults) {
  const performanceMetrics = {
    renderingTests: [],
    navigationTests: [],
    memoryTests: [],
    storageTests: [],
    averageTestTime: 0,
    slowestTests: [],
  };

  let totalTime = 0;
  let testCount = 0;
  const allTests = [];

  testResults.testResults.forEach(testSuite => {
    testSuite.testResults.forEach(test => {
      const duration = test.duration || 0;
      totalTime += duration;
      testCount++;

      allTests.push({
        name: test.fullName,
        duration: duration,
        status: test.status,
      });

      // Categorize performance tests
      const testName = test.fullName.toLowerCase();
      const testData = {
        name: test.fullName,
        duration: duration,
        status: test.status,
      };

      if (testName.includes('render')) {
        performanceMetrics.renderingTests.push(testData);
      } else if (testName.includes('navigation')) {
        performanceMetrics.navigationTests.push(testData);
      } else if (testName.includes('memory')) {
        performanceMetrics.memoryTests.push(testData);
      } else if (testName.includes('storage')) {
        performanceMetrics.storageTests.push(testData);
      }
    });
  });

  // Calculate average test time
  performanceMetrics.averageTestTime = testCount > 0 ? totalTime / testCount : 0;

  // Find slowest tests
  performanceMetrics.slowestTests = allTests
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  return performanceMetrics;
}

/**
 * Analyze test failures for common patterns
 */
function analyzeFailures(testResults) {
  const failureAnalysis = {
    totalFailures: 0,
    platformSpecificFailures: {
      ios: [],
      android: [],
      crossPlatform: [],
    },
    commonFailurePatterns: {},
    criticalFailures: [],
  };

  testResults.testResults.forEach(testSuite => {
    testSuite.testResults.forEach(test => {
      if (test.status === 'failed') {
        failureAnalysis.totalFailures++;

        const platform = determinePlatform(test.fullName);
        const failureData = {
          testName: test.fullName,
          failureMessage: test.failureMessages?.[0] || 'Unknown failure',
          duration: test.duration || 0,
        };

        failureAnalysis.platformSpecificFailures[platform].push(failureData);

        // Analyze failure patterns
        analyzeFailurePatterns(failureData, failureAnalysis.commonFailurePatterns);

        // Identify critical failures
        if (isCriticalFailure(failureData.failureMessage)) {
          failureAnalysis.criticalFailures.push(failureData);
        }
      }
    });
  });

  return failureAnalysis;
}

/**
 * Analyze failure patterns
 */
function analyzeFailurePatterns(failureData, patterns) {
  const failureMessage = failureData.failureMessage.toLowerCase();

  const patternKeywords = [
    'timeout',
    'network',
    'permission',
    'platform',
    'navigation',
    'render',
    'memory',
    'storage',
    'animation',
    'gesture',
  ];

  patternKeywords.forEach(keyword => {
    if (failureMessage.includes(keyword)) {
      patterns[keyword] = (patterns[keyword] || 0) + 1;
    }
  });
}

/**
 * Determine if failure is critical
 */
function isCriticalFailure(failureMessage) {
  const criticalKeywords = [
    'crash',
    'fatal',
    'segmentation fault',
    'out of memory',
    'security',
    'permission denied',
  ];

  const lowerMessage = failureMessage.toLowerCase();
  return criticalKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(testResults) {
  const recommendations = [];
  const summary = extractSummary(testResults);
  const failureAnalysis = analyzeFailures(testResults);
  const performanceMetrics = extractPerformanceMetrics(testResults);

  // Test coverage recommendations
  if (summary.numTotalTests < 50) {
    recommendations.push({
      category: 'coverage',
      priority: 'medium',
      message: 'Consider adding more cross-platform tests for better coverage.',
      action: 'Expand test suite to cover more platform-specific scenarios.',
    });
  }

  // Failure rate recommendations
  const failureRate = summary.numFailedTests / summary.numTotalTests;
  if (failureRate > 0.1) {
    recommendations.push({
      category: 'reliability',
      priority: 'high',
      message: `High failure rate detected (${(failureRate * 100).toFixed(1)}%).`,
      action: 'Investigate and fix failing tests to improve platform compatibility.',
    });
  }

  // Performance recommendations
  if (performanceMetrics.averageTestTime > 100) {
    recommendations.push({
      category: 'performance',
      priority: 'medium',
      message: `Average test time is ${performanceMetrics.averageTestTime.toFixed(1)}ms.`,
      action: 'Optimize test performance or consider parallel execution.',
    });
  }

  // Platform-specific recommendations
  const platformBreakdown = analyzePlatformResults(testResults);
  Object.entries(platformBreakdown).forEach(([platform, stats]) => {
    const platformFailureRate = stats.tests > 0 ? stats.failed / stats.tests : 0;
    if (platformFailureRate > 0.2) {
      recommendations.push({
        category: 'platform',
        priority: 'high',
        message: `High failure rate on ${platform} (${(platformFailureRate * 100).toFixed(1)}%).`,
        action: `Focus on ${platform}-specific testing and implementation fixes.`,
      });
    }
  });

  // Critical failure recommendations
  if (failureAnalysis.criticalFailures.length > 0) {
    recommendations.push({
      category: 'critical',
      priority: 'critical',
      message: `${failureAnalysis.criticalFailures.length} critical failures detected.`,
      action: 'Address critical failures immediately before release.',
    });
  }

  // Pattern-based recommendations
  Object.entries(failureAnalysis.commonFailurePatterns).forEach(([pattern, count]) => {
    if (count >= 3) {
      recommendations.push({
        category: 'pattern',
        priority: 'medium',
        message: `Multiple failures related to ${pattern} (${count} occurrences).`,
        action: `Review and fix ${pattern}-related issues across the codebase.`,
      });
    }
  });

  return recommendations;
}

/**
 * Save processed results to file
 */
function saveProcessedResults(processedResults) {
  const outputDir = path.join(process.cwd(), 'test-results');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save JSON results
  const jsonPath = path.join(outputDir, 'cross-platform-processed-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(processedResults, null, 2));

  // Save summary report
  const summaryPath = path.join(outputDir, 'cross-platform-summary.txt');
  const summaryContent = generateSummaryReport(processedResults);
  fs.writeFileSync(summaryPath, summaryContent);

  console.log(`📄 Processed results saved to: ${jsonPath}`);
  console.log(`📋 Summary report saved to: ${summaryPath}`);
}

/**
 * Generate human-readable summary report
 */
function generateSummaryReport(processedResults) {
  const { summary, platformBreakdown, performanceMetrics, failureAnalysis, recommendations } = processedResults;
  
  const lines = [
    'Cross-Platform Test Results Summary',
    '===================================',
    '',
    `Timestamp: ${processedResults.timestamp}`,
    '',
    'Overall Results:',
    `- Total Tests: ${summary.numTotalTests}`,
    `- Passed: ${summary.numPassedTests}`,
    `- Failed: ${summary.numFailedTests}`,
    `- Pending: ${summary.numPendingTests}`,
    `- Success Rate: ${((summary.numPassedTests / summary.numTotalTests) * 100).toFixed(1)}%`,
    `- Total Runtime: ${summary.testRunTime}ms`,
    '',
    'Platform Breakdown:',
  ];

  Object.entries(platformBreakdown).forEach(([platform, stats]) => {
    const successRate = stats.tests > 0 ? ((stats.passed / stats.tests) * 100).toFixed(1) : '0';
    lines.push(`- ${platform.toUpperCase()}: ${stats.passed}/${stats.tests} (${successRate}%)`);
  });

  lines.push('');
  lines.push('Performance Metrics:');
  lines.push(`- Average Test Time: ${performanceMetrics.averageTestTime.toFixed(1)}ms`);
  lines.push(`- Rendering Tests: ${performanceMetrics.renderingTests.length}`);
  lines.push(`- Navigation Tests: ${performanceMetrics.navigationTests.length}`);
  lines.push(`- Memory Tests: ${performanceMetrics.memoryTests.length}`);

  if (performanceMetrics.slowestTests.length > 0) {
    lines.push('');
    lines.push('Slowest Tests:');
    performanceMetrics.slowestTests.slice(0, 5).forEach((test, index) => {
      lines.push(`${index + 1}. ${test.name}: ${test.duration}ms`);
    });
  }

  if (failureAnalysis.totalFailures > 0) {
    lines.push('');
    lines.push('Failure Analysis:');
    lines.push(`- Total Failures: ${failureAnalysis.totalFailures}`);
    lines.push(`- Critical Failures: ${failureAnalysis.criticalFailures.length}`);
    
    if (Object.keys(failureAnalysis.commonFailurePatterns).length > 0) {
      lines.push('- Common Patterns:');
      Object.entries(failureAnalysis.commonFailurePatterns).forEach(([pattern, count]) => {
        lines.push(`  - ${pattern}: ${count} occurrences`);
      });
    }
  }

  if (recommendations.length > 0) {
    lines.push('');
    lines.push('Recommendations:');
    recommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      lines.push(`   Action: ${rec.action}`);
    });
  }

  return lines.join('\n');
}

module.exports = processResults;