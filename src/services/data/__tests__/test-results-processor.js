/**
 * Test Results Processor for Integration Tests
 * Processes and formats test results for reporting
 */

const fs = require('fs');
const path = require('path');

/**
 * Processes Jest test results and generates custom reports
 */
function processResults(results) {
  const {
    numTotalTests,
    numPassedTests,
    numFailedTests,
    numPendingTests,
    testResults,
    startTime,
    success
  } = results;

  const duration = Date.now() - startTime;
  const successRate = numTotalTests > 0 ? (numPassedTests / numTotalTests * 100).toFixed(1) : '0';

  // Create detailed report
  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      totalTests: numTotalTests,
      passedTests: numPassedTests,
      failedTests: numFailedTests,
      pendingTests: numPendingTests,
      successRate: `${successRate}%`,
      duration: `${(duration / 1000).toFixed(2)}s`,
      success: success
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      mongoUri: process.env.MONGODB_TEST_URI ? 'Configured' : 'Default',
      pythonPath: process.env.PYTHON_PATH || 'Default'
    },
    testSuites: [],
    performance: {
      slowestTests: [],
      memoryUsage: process.memoryUsage(),
      averageTestTime: numTotalTests > 0 ? (duration / numTotalTests).toFixed(2) : '0'
    },
    coverage: null // Will be populated if coverage is available
  };

  // Process each test suite
  testResults.forEach(suiteResult => {
    const suite = {
      name: path.basename(suiteResult.testFilePath),
      path: suiteResult.testFilePath,
      duration: suiteResult.perfStats.end - suiteResult.perfStats.start,
      numTests: suiteResult.numPassingTests + suiteResult.numFailingTests + suiteResult.numPendingTests,
      numPassed: suiteResult.numPassingTests,
      numFailed: suiteResult.numFailingTests,
      numPending: suiteResult.numPendingTests,
      tests: []
    };

    // Process individual tests
    suiteResult.testResults.forEach(testResult => {
      const test = {
        name: testResult.fullName,
        status: testResult.status,
        duration: testResult.duration || 0,
        error: testResult.failureMessages.length > 0 ? testResult.failureMessages[0] : null
      };

      suite.tests.push(test);

      // Track slowest tests
      if (test.duration > 1000) { // Tests slower than 1 second
        report.performance.slowestTests.push({
          name: test.name,
          suite: suite.name,
          duration: test.duration
        });
      }
    });

    report.testSuites.push(suite);
  });

  // Sort slowest tests
  report.performance.slowestTests.sort((a, b) => b.duration - a.duration);
  report.performance.slowestTests = report.performance.slowestTests.slice(0, 10); // Top 10

  // Generate console output
  console.log('\n' + '='.repeat(60));
  console.log('📊 INTEGRATION TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${numTotalTests}`);
  console.log(`✅ Passed: ${numPassedTests}`);
  console.log(`❌ Failed: ${numFailedTests}`);
  console.log(`⏸️ Pending: ${numPendingTests}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`💾 Memory: ${Math.round(report.performance.memoryUsage.heapUsed / 1024 / 1024)}MB`);

  if (report.performance.slowestTests.length > 0) {
    console.log('\n🐌 Slowest Tests:');
    report.performance.slowestTests.slice(0, 5).forEach(test => {
      console.log(`  ${test.name}: ${test.duration}ms`);
    });
  }

  if (numFailedTests > 0) {
    console.log('\n❌ Failed Tests:');
    report.testSuites.forEach(suite => {
      suite.tests.filter(test => test.status === 'failed').forEach(test => {
        console.log(`  ${suite.name}: ${test.name}`);
        if (test.error) {
          console.log(`    Error: ${test.error.split('\n')[0]}`);
        }
      });
    });
  }

  console.log('\n' + (success ? '🎉 All tests passed!' : '⚠️ Some tests failed'));
  console.log('='.repeat(60));

  // Save detailed report
  try {
    const reportDir = path.join(process.cwd(), 'test-results', 'integration');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'detailed-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    // Generate markdown report
    const markdownReport = generateMarkdownReport(report);
    const markdownPath = path.join(reportDir, 'test-report.md');
    fs.writeFileSync(markdownPath, markdownReport);
    console.log(`📝 Markdown report saved to: ${markdownPath}`);

  } catch (error) {
    console.error('⚠️ Failed to save test report:', error);
  }

  return results;
}

/**
 * Generates a markdown report from test results
 */
function generateMarkdownReport(report) {
  let markdown = `# Integration Test Report\n\n`;
  markdown += `**Generated:** ${report.summary.timestamp}\n\n`;

  // Summary table
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Tests | ${report.summary.totalTests} |\n`;
  markdown += `| Passed | ${report.summary.passedTests} |\n`;
  markdown += `| Failed | ${report.summary.failedTests} |\n`;
  markdown += `| Pending | ${report.summary.pendingTests} |\n`;
  markdown += `| Success Rate | ${report.summary.successRate} |\n`;
  markdown += `| Duration | ${report.summary.duration} |\n`;
  markdown += `| Memory Usage | ${Math.round(report.performance.memoryUsage.heapUsed / 1024 / 1024)}MB |\n\n`;

  // Environment info
  markdown += `## Environment\n\n`;
  markdown += `- **Node Version:** ${report.environment.nodeVersion}\n`;
  markdown += `- **Platform:** ${report.environment.platform}\n`;
  markdown += `- **MongoDB:** ${report.environment.mongoUri}\n`;
  markdown += `- **Python:** ${report.environment.pythonPath}\n\n`;

  // Test suites
  markdown += `## Test Suites\n\n`;
  report.testSuites.forEach(suite => {
    const status = suite.numFailed > 0 ? '❌' : '✅';
    markdown += `### ${status} ${suite.name}\n\n`;
    markdown += `- **Tests:** ${suite.numTests}\n`;
    markdown += `- **Passed:** ${suite.numPassed}\n`;
    markdown += `- **Failed:** ${suite.numFailed}\n`;
    markdown += `- **Duration:** ${suite.duration}ms\n\n`;

    if (suite.numFailed > 0) {
      markdown += `**Failed Tests:**\n`;
      suite.tests.filter(test => test.status === 'failed').forEach(test => {
        markdown += `- ${test.name}\n`;
      });
      markdown += `\n`;
    }
  });

  // Performance insights
  if (report.performance.slowestTests.length > 0) {
    markdown += `## Performance Insights\n\n`;
    markdown += `**Slowest Tests:**\n\n`;
    report.performance.slowestTests.forEach(test => {
      markdown += `- ${test.name} (${test.suite}): ${test.duration}ms\n`;
    });
    markdown += `\n`;
  }

  // Recommendations
  markdown += `## Recommendations\n\n`;
  if (report.summary.failedTests > 0) {
    markdown += `- ⚠️ Fix ${report.summary.failedTests} failing test(s)\n`;
  }
  if (report.performance.slowestTests.length > 0) {
    markdown += `- 🐌 Optimize ${report.performance.slowestTests.length} slow test(s)\n`;
  }
  if (parseFloat(report.summary.successRate) < 100) {
    markdown += `- 📈 Improve test success rate (currently ${report.summary.successRate})\n`;
  }
  if (report.performance.memoryUsage.heapUsed > 100 * 1024 * 1024) {
    markdown += `- 💾 Monitor memory usage (currently ${Math.round(report.performance.memoryUsage.heapUsed / 1024 / 1024)}MB)\n`;
  }

  return markdown;
}

module.exports = processResults;