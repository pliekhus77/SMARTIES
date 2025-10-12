/**
 * Cross-Platform Test Reporter
 * Task 8.4: Custom Jest reporter for cross-platform compatibility analysis
 * 
 * This reporter provides detailed analysis of cross-platform test results,
 * including platform-specific metrics and compatibility insights.
 * 
 * Requirements: 3.5
 */

const fs = require('fs');
const path = require('path');

class CrossPlatformTestReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.results = {
      testResults: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        totalTime: 0,
      },
      platformAnalysis: {
        ios: { tests: 0, passed: 0, failed: 0, avgTime: 0 },
        android: { tests: 0, passed: 0, failed: 0, avgTime: 0 },
        crossPlatform: { tests: 0, passed: 0, failed: 0, avgTime: 0 },
      },
      performanceMetrics: {
        renderingTests: [],
        navigationTests: [],
        memoryTests: [],
        animationTests: [],
      },
      compatibilityIssues: [],
      recommendations: [],
    };
  }

  onRunStart(results, options) {
    console.log('\n🔄 Starting Cross-Platform Compatibility Tests...\n');
  }

  onTestResult(test, testResult, aggregatedResult) {
    // Analyze test results for cross-platform insights
    this.analyzeTestResult(testResult);
    
    // Store test result for detailed analysis
    this.results.testResults.push({
      testFilePath: testResult.testFilePath,
      numPassingTests: testResult.numPassingTests,
      numFailingTests: testResult.numFailingTests,
      numPendingTests: testResult.numPendingTests,
      perfStats: testResult.perfStats,
      testResults: testResult.testResults,
    });
  }

  onRunComplete(contexts, results) {
    // Generate final analysis
    this.generateFinalAnalysis(results);
    
    // Save detailed report
    this.saveReport();
    
    // Display summary
    this.displaySummary();
  }

  analyzeTestResult(testResult) {
    const { testFilePath, testResults, perfStats } = testResult;
    
    // Determine test category based on file path
    const testCategory = this.categorizeTest(testFilePath);
    
    // Analyze individual test cases
    testResults.forEach(test => {
      this.analyzeIndividualTest(test, testCategory, perfStats);
    });
  }

  categorizeTest(testFilePath) {
    if (testFilePath.includes('PlatformCompatibility')) {
      return 'platform';
    } else if (testFilePath.includes('UIConsistency')) {
      return 'ui';
    } else if (testFilePath.includes('PerformanceBenchmarks')) {
      return 'performance';
    } else if (testFilePath.includes('NavigationConsistency')) {
      return 'navigation';
    }
    return 'general';
  }

  analyzeIndividualTest(test, category, perfStats) {
    const { title, status, duration } = test;
    
    // Update summary statistics
    this.results.summary.totalTests++;
    if (status === 'passed') {
      this.results.summary.passedTests++;
    } else if (status === 'failed') {
      this.results.summary.failedTests++;
      this.analyzeFailure(test, category);
    } else {
      this.results.summary.skippedTests++;
    }
    
    // Analyze platform-specific tests
    this.analyzePlatformSpecificTest(test, category);
    
    // Analyze performance metrics
    if (category === 'performance') {
      this.analyzePerformanceTest(test, duration);
    }
    
    // Check for compatibility issues
    this.checkCompatibilityIssues(test, category);
  }

  analyzePlatformSpecificTest(test, category) {
    const { title, status, duration } = test;
    
    // Determine if test is platform-specific
    let platform = 'crossPlatform';
    if (title.toLowerCase().includes('ios')) {
      platform = 'ios';
    } else if (title.toLowerCase().includes('android')) {
      platform = 'android';
    }
    
    // Update platform statistics
    const platformStats = this.results.platformAnalysis[platform];
    platformStats.tests++;
    
    if (status === 'passed') {
      platformStats.passed++;
    } else if (status === 'failed') {
      platformStats.failed++;
    }
    
    // Update average time
    const totalTime = platformStats.avgTime * (platformStats.tests - 1) + (duration || 0);
    platformStats.avgTime = totalTime / platformStats.tests;
  }

  analyzePerformanceTest(test, duration) {
    const { title } = test;
    
    const performanceData = {
      testName: title,
      duration: duration || 0,
      status: test.status,
      category: this.getPerformanceCategory(title),
    };
    
    // Categorize performance test
    if (title.toLowerCase().includes('render')) {
      this.results.performanceMetrics.renderingTests.push(performanceData);
    } else if (title.toLowerCase().includes('navigation')) {
      this.results.performanceMetrics.navigationTests.push(performanceData);
    } else if (title.toLowerCase().includes('memory')) {
      this.results.performanceMetrics.memoryTests.push(performanceData);
    } else if (title.toLowerCase().includes('animation')) {
      this.results.performanceMetrics.animationTests.push(performanceData);
    }
  }

  getPerformanceCategory(title) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('render')) return 'rendering';
    if (lowerTitle.includes('navigation')) return 'navigation';
    if (lowerTitle.includes('memory')) return 'memory';
    if (lowerTitle.includes('animation')) return 'animation';
    if (lowerTitle.includes('storage')) return 'storage';
    if (lowerTitle.includes('interaction')) return 'interaction';
    return 'general';
  }

  analyzeFailure(test, category) {
    const { title, failureMessages } = test;
    
    // Analyze failure for compatibility issues
    const compatibilityIssue = {
      testName: title,
      category: category,
      failureMessage: failureMessages?.[0] || 'Unknown failure',
      severity: this.determineSeverity(failureMessages?.[0] || ''),
      platform: this.extractPlatformFromFailure(failureMessages?.[0] || ''),
    };
    
    this.results.compatibilityIssues.push(compatibilityIssue);
  }

  determineSeverity(failureMessage) {
    const lowerMessage = failureMessage.toLowerCase();
    
    if (lowerMessage.includes('crash') || lowerMessage.includes('fatal')) {
      return 'critical';
    } else if (lowerMessage.includes('performance') || lowerMessage.includes('timeout')) {
      return 'high';
    } else if (lowerMessage.includes('ui') || lowerMessage.includes('layout')) {
      return 'medium';
    }
    
    return 'low';
  }

  extractPlatformFromFailure(failureMessage) {
    const lowerMessage = failureMessage.toLowerCase();
    
    if (lowerMessage.includes('ios')) return 'ios';
    if (lowerMessage.includes('android')) return 'android';
    
    return 'both';
  }

  checkCompatibilityIssues(test, category) {
    const { title, status } = test;
    
    // Check for common compatibility patterns
    if (status === 'failed') {
      const potentialIssues = this.identifyCompatibilityPatterns(test);
      this.results.compatibilityIssues.push(...potentialIssues);
    }
  }

  identifyCompatibilityPatterns(test) {
    const issues = [];
    const { title, failureMessages } = test;
    const failureMessage = failureMessages?.[0] || '';
    
    // Common compatibility issue patterns
    const patterns = [
      {
        pattern: /platform\.select/i,
        issue: 'Platform-specific code not working correctly',
        recommendation: 'Review Platform.select() usage and ensure all platforms are handled',
      },
      {
        pattern: /dimensions/i,
        issue: 'Screen dimension handling inconsistency',
        recommendation: 'Implement responsive design patterns for different screen sizes',
      },
      {
        pattern: /navigation/i,
        issue: 'Navigation behavior differs between platforms',
        recommendation: 'Test navigation flows on both iOS and Android simulators',
      },
      {
        pattern: /permission/i,
        issue: 'Permission handling differs between platforms',
        recommendation: 'Implement platform-specific permission handling',
      },
      {
        pattern: /storage/i,
        issue: 'Storage behavior inconsistency',
        recommendation: 'Verify storage operations work consistently across platforms',
      },
    ];
    
    patterns.forEach(({ pattern, issue, recommendation }) => {
      if (pattern.test(failureMessage) || pattern.test(title)) {
        issues.push({
          testName: title,
          issue,
          recommendation,
          severity: 'medium',
        });
      }
    });
    
    return issues;
  }

  generateFinalAnalysis(results) {
    // Calculate overall statistics
    this.results.summary.totalTime = results.runTime;
    
    // Generate recommendations based on analysis
    this.generateRecommendations();
    
    // Calculate compatibility score
    this.calculateCompatibilityScore();
  }

  generateRecommendations() {
    const { platformAnalysis, compatibilityIssues, performanceMetrics } = this.results;
    
    // Platform-specific recommendations
    Object.entries(platformAnalysis).forEach(([platform, stats]) => {
      if (stats.failed > 0) {
        this.results.recommendations.push({
          category: 'platform',
          priority: 'high',
          message: `${stats.failed} tests failed on ${platform}. Review platform-specific implementations.`,
          action: `Focus on ${platform}-specific testing and implementation fixes.`,
        });
      }
    });
    
    // Performance recommendations
    const slowRenderingTests = performanceMetrics.renderingTests.filter(t => t.duration > 100);
    if (slowRenderingTests.length > 0) {
      this.results.recommendations.push({
        category: 'performance',
        priority: 'medium',
        message: `${slowRenderingTests.length} rendering tests exceeded 100ms threshold.`,
        action: 'Optimize component rendering performance and consider lazy loading.',
      });
    }
    
    // Compatibility issue recommendations
    const criticalIssues = compatibilityIssues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      this.results.recommendations.push({
        category: 'compatibility',
        priority: 'critical',
        message: `${criticalIssues.length} critical compatibility issues found.`,
        action: 'Address critical compatibility issues immediately before release.',
      });
    }
    
    // General recommendations
    this.results.recommendations.push({
      category: 'testing',
      priority: 'info',
      message: 'Continue running cross-platform tests regularly.',
      action: 'Integrate cross-platform tests into CI/CD pipeline for continuous validation.',
    });
  }

  calculateCompatibilityScore() {
    const { summary, compatibilityIssues } = this.results;
    
    let score = 100;
    
    // Deduct points for failed tests
    const failureRate = summary.failedTests / summary.totalTests;
    score -= failureRate * 50;
    
    // Deduct points for compatibility issues
    const criticalIssues = compatibilityIssues.filter(i => i.severity === 'critical').length;
    const highIssues = compatibilityIssues.filter(i => i.severity === 'high').length;
    const mediumIssues = compatibilityIssues.filter(i => i.severity === 'medium').length;
    
    score -= criticalIssues * 20;
    score -= highIssues * 10;
    score -= mediumIssues * 5;
    
    // Ensure score doesn't go below 0
    score = Math.max(0, Math.round(score));
    
    this.results.compatibilityScore = score;
  }

  saveReport() {
    if (!this.options.outputFile) return;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      ...this.results,
    };
    
    // Ensure output directory exists
    const outputDir = path.dirname(this.options.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save JSON report
    fs.writeFileSync(this.options.outputFile, JSON.stringify(reportData, null, 2));
    
    // Save human-readable report
    const readableReport = this.generateReadableReport(reportData);
    const readableReportPath = this.options.outputFile.replace('.json', '.md');
    fs.writeFileSync(readableReportPath, readableReport);
  }

  generateReadableReport(data) {
    const lines = [
      '# Cross-Platform Compatibility Test Report',
      '',
      `**Generated:** ${data.timestamp}`,
      `**Compatibility Score:** ${data.compatibilityScore}/100`,
      '',
      '## Summary',
      '',
      `- **Total Tests:** ${data.summary.totalTests}`,
      `- **Passed:** ${data.summary.passedTests}`,
      `- **Failed:** ${data.summary.failedTests}`,
      `- **Skipped:** ${data.summary.skippedTests}`,
      `- **Total Time:** ${data.summary.totalTime}ms`,
      '',
      '## Platform Analysis',
      '',
    ];
    
    // Add platform-specific results
    Object.entries(data.platformAnalysis).forEach(([platform, stats]) => {
      lines.push(`### ${platform.toUpperCase()}`);
      lines.push(`- Tests: ${stats.tests}`);
      lines.push(`- Passed: ${stats.passed}`);
      lines.push(`- Failed: ${stats.failed}`);
      lines.push(`- Avg Time: ${stats.avgTime.toFixed(2)}ms`);
      lines.push('');
    });
    
    // Add performance metrics
    if (data.performanceMetrics.renderingTests.length > 0) {
      lines.push('## Performance Metrics');
      lines.push('');
      lines.push('### Rendering Performance');
      data.performanceMetrics.renderingTests.forEach(test => {
        const status = test.status === 'passed' ? '✅' : '❌';
        lines.push(`- ${status} ${test.testName}: ${test.duration}ms`);
      });
      lines.push('');
    }
    
    // Add compatibility issues
    if (data.compatibilityIssues.length > 0) {
      lines.push('## Compatibility Issues');
      lines.push('');
      data.compatibilityIssues.forEach((issue, index) => {
        const severity = issue.severity.toUpperCase();
        const icon = issue.severity === 'critical' ? '🔴' : 
                    issue.severity === 'high' ? '🟠' : 
                    issue.severity === 'medium' ? '🟡' : '🔵';
        
        lines.push(`### ${index + 1}. ${icon} ${severity}`);
        lines.push(`**Test:** ${issue.testName}`);
        lines.push(`**Issue:** ${issue.issue || issue.failureMessage}`);
        if (issue.recommendation) {
          lines.push(`**Recommendation:** ${issue.recommendation}`);
        }
        lines.push('');
      });
    }
    
    // Add recommendations
    if (data.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      data.recommendations.forEach((rec, index) => {
        const priority = rec.priority.toUpperCase();
        const icon = rec.priority === 'critical' ? '🔴' : 
                    rec.priority === 'high' ? '🟠' : 
                    rec.priority === 'medium' ? '🟡' : 'ℹ️';
        
        lines.push(`### ${index + 1}. ${icon} ${priority} - ${rec.category}`);
        lines.push(`**Message:** ${rec.message}`);
        lines.push(`**Action:** ${rec.action}`);
        lines.push('');
      });
    }
    
    return lines.join('\n');
  }

  displaySummary() {
    const { summary, compatibilityScore, platformAnalysis } = this.results;
    
    console.log('\n📊 Cross-Platform Test Results Summary');
    console.log('=====================================');
    console.log(`🎯 Compatibility Score: ${compatibilityScore}/100`);
    console.log(`📈 Tests: ${summary.totalTests} total, ${summary.passedTests} passed, ${summary.failedTests} failed`);
    console.log(`⏱️  Total Time: ${summary.totalTime}ms`);
    
    console.log('\n🔍 Platform Breakdown:');
    Object.entries(platformAnalysis).forEach(([platform, stats]) => {
      const successRate = stats.tests > 0 ? ((stats.passed / stats.tests) * 100).toFixed(1) : '0';
      console.log(`  ${platform.toUpperCase()}: ${stats.passed}/${stats.tests} (${successRate}%)`);
    });
    
    if (compatibilityScore >= 90) {
      console.log('\n✅ Excellent cross-platform compatibility!');
    } else if (compatibilityScore >= 75) {
      console.log('\n⚠️  Good compatibility with some areas for improvement.');
    } else {
      console.log('\n❌ Significant compatibility issues detected. Review recommendations.');
    }
    
    console.log('\n');
  }
}

module.exports = CrossPlatformTestReporter;