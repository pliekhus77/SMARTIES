#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate a test summary report from Jest results
 */
function generateTestSummary() {
  const testResultsPath = path.join(__dirname, '../test-results');
  const integrationResultsPath = path.join(__dirname, '../integration-test-results');
  
  let summary = {
    unit: { passed: 0, failed: 0, total: 0, coverage: null },
    integration: { passed: 0, failed: 0, total: 0 },
    overall: { passed: 0, failed: 0, total: 0 }
  };

  // Read unit test results
  try {
    const unitResultsFile = path.join(testResultsPath, 'test-results.xml');
    if (fs.existsSync(unitResultsFile)) {
      const unitResults = fs.readFileSync(unitResultsFile, 'utf8');
      // Parse XML results (simplified)
      const testcases = (unitResults.match(/<testcase/g) || []).length;
      const failures = (unitResults.match(/<failure/g) || []).length;
      const errors = (unitResults.match(/<error/g) || []).length;
      
      summary.unit.total = testcases;
      summary.unit.failed = failures + errors;
      summary.unit.passed = testcases - (failures + errors);
    }
  } catch (error) {
    console.warn('Could not read unit test results:', error.message);
  }

  // Read integration test results
  try {
    const integrationResultsFile = path.join(integrationResultsPath, 'integration-test-results.xml');
    if (fs.existsSync(integrationResultsFile)) {
      const integrationResults = fs.readFileSync(integrationResultsFile, 'utf8');
      // Parse XML results (simplified)
      const testcases = (integrationResults.match(/<testcase/g) || []).length;
      const failures = (integrationResults.match(/<failure/g) || []).length;
      const errors = (integrationResults.match(/<error/g) || []).length;
      
      summary.integration.total = testcases;
      summary.integration.failed = failures + errors;
      summary.integration.passed = testcases - (failures + errors);
    }
  } catch (error) {
    console.warn('Could not read integration test results:', error.message);
  }

  // Calculate overall summary
  summary.overall.total = summary.unit.total + summary.integration.total;
  summary.overall.passed = summary.unit.passed + summary.integration.passed;
  summary.overall.failed = summary.unit.failed + summary.integration.failed;

  // Read coverage information
  try {
    const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');
    if (fs.existsSync(coverageFile)) {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      summary.unit.coverage = {
        lines: coverage.total.lines.pct,
        functions: coverage.total.functions.pct,
        branches: coverage.total.branches.pct,
        statements: coverage.total.statements.pct
      };
    }
  } catch (error) {
    console.warn('Could not read coverage information:', error.message);
  }

  return summary;
}

/**
 * Format and display the test summary
 */
function displaySummary(summary) {
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  
  console.log('\n🧪 Unit Tests:');
  console.log(`   Passed: ${summary.unit.passed}`);
  console.log(`   Failed: ${summary.unit.failed}`);
  console.log(`   Total:  ${summary.unit.total}`);
  
  if (summary.unit.coverage) {
    console.log('\n📈 Code Coverage:');
    console.log(`   Lines:      ${summary.unit.coverage.lines}%`);
    console.log(`   Functions:  ${summary.unit.coverage.functions}%`);
    console.log(`   Branches:   ${summary.unit.coverage.branches}%`);
    console.log(`   Statements: ${summary.unit.coverage.statements}%`);
  }
  
  console.log('\n🔗 Integration Tests:');
  console.log(`   Passed: ${summary.integration.passed}`);
  console.log(`   Failed: ${summary.integration.failed}`);
  console.log(`   Total:  ${summary.integration.total}`);
  
  console.log('\n📋 Overall Results:');
  console.log(`   Passed: ${summary.overall.passed}`);
  console.log(`   Failed: ${summary.overall.failed}`);
  console.log(`   Total:  ${summary.overall.total}`);
  
  const successRate = summary.overall.total > 0 
    ? ((summary.overall.passed / summary.overall.total) * 100).toFixed(1)
    : '0.0';
  
  console.log(`   Success Rate: ${successRate}%`);
  
  if (summary.overall.failed > 0) {
    console.log('\n❌ Some tests failed. Check the detailed results above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Generate and display summary
if (require.main === module) {
  const summary = generateTestSummary();
  displaySummary(summary);
}

module.exports = { generateTestSummary, displaySummary };