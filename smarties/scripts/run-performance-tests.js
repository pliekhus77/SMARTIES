#!/usr/bin/env node

/**
 * Performance Test Runner
 * Task 8.3: Validate performance requirements
 * 
 * Runs all performance tests and generates a comprehensive report
 * Requirements: 2.5
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Performance test configuration
const PERFORMANCE_TESTS = [
  {
    name: 'Database Performance',
    file: '__tests__/performance/database-performance.test.ts',
    description: 'Tests database query response times meet sub-100ms requirement'
  },
  {
    name: 'App Startup Performance',
    file: '__tests__/performance/app-startup-performance.test.ts',
    description: 'Tests app startup time and initialization performance'
  },
  {
    name: 'Navigation Performance',
    file: '__tests__/performance/navigation-performance.test.ts',
    description: 'Tests navigation responsiveness and screen transitions'
  },
  {
    name: 'Memory Performance',
    file: '__tests__/performance/memory-performance.test.ts',
    description: 'Tests memory usage and performance optimization'
  }
];

// Performance thresholds (from requirements)
const PERFORMANCE_THRESHOLDS = {
  databaseQueryTime: 100, // ms
  appStartupTime: 2000, // ms
  navigationTime: 200, // ms
  memoryUsage: 100 * 1024 * 1024, // 100MB
  tabSwitchTime: 100, // ms
  connectionTime: 1000 // ms
};

class PerformanceTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Performance Test Suite');
    console.log('=====================================\n');

    for (const test of PERFORMANCE_TESTS) {
      await this.runTest(test);
    }

    this.generateReport();
  }

  async runTest(test) {
    console.log(`📊 Running ${test.name}...`);
    console.log(`   ${test.description}`);
    
    const testStartTime = Date.now();
    
    try {
      // Run the specific test file
      const output = execSync(
        `npm test -- --testPathPattern="${test.file}" --verbose --silent`,
        { 
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      const testEndTime = Date.now();
      const duration = testEndTime - testStartTime;

      // Parse test output for performance metrics
      const metrics = this.parseTestOutput(output);

      this.results.push({
        name: test.name,
        file: test.file,
        status: 'PASSED',
        duration,
        metrics,
        output: output.split('\n').filter(line => 
          line.includes('ms') || line.includes('MB') || line.includes('KB')
        )
      });

      console.log(`   ✅ PASSED (${duration}ms)\n`);

    } catch (error) {
      const testEndTime = Date.now();
      const duration = testEndTime - testStartTime;

      this.results.push({
        name: test.name,
        file: test.file,
        status: 'FAILED',
        duration,
        error: error.message,
        output: error.stdout ? error.stdout.split('\n') : []
      });

      console.log(`   ❌ FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  parseTestOutput(output) {
    const metrics = {};
    const lines = output.split('\n');

    lines.forEach(line => {
      // Parse database response times
      if (line.includes('response time:')) {
        const match = line.match(/(\w+.*?response time): (\d+)ms/);
        if (match) {
          metrics[match[1]] = parseInt(match[2]);
        }
      }

      // Parse initialization times
      if (line.includes('initialization time:')) {
        const match = line.match(/(\w+.*?initialization time): (\d+)ms/);
        if (match) {
          metrics[match[1]] = parseInt(match[2]);
        }
      }

      // Parse navigation times
      if (line.includes('navigation time:') || line.includes('switch time:')) {
        const match = line.match(/(\w+.*?time): (\d+)ms/);
        if (match) {
          metrics[match[1]] = parseInt(match[2]);
        }
      }

      // Parse memory usage
      if (line.includes('memory increase:') || line.includes('Memory increase:')) {
        const match = line.match(/(\w+.*?increase): (\d+)(MB|KB)/);
        if (match) {
          const value = parseInt(match[2]);
          const unit = match[3];
          metrics[match[1]] = unit === 'MB' ? value * 1024 * 1024 : value * 1024;
        }
      }
    });

    return metrics;
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.status === 'PASSED').length;
    const failedTests = this.results.filter(r => r.status === 'FAILED').length;

    console.log('\n📈 Performance Test Results');
    console.log('============================\n');

    // Summary
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total Duration: ${totalDuration}ms\n`);

    // Detailed results
    this.results.forEach(result => {
      console.log(`${result.status === 'PASSED' ? '✅' : '❌'} ${result.name}`);
      console.log(`   Duration: ${result.duration}ms`);
      
      if (result.metrics && Object.keys(result.metrics).length > 0) {
        console.log('   Performance Metrics:');
        Object.entries(result.metrics).forEach(([key, value]) => {
          const threshold = this.getThreshold(key);
          const status = threshold && value > threshold ? '⚠️' : '✅';
          console.log(`     ${status} ${key}: ${this.formatMetric(key, value)}`);
        });
      }

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      console.log('');
    });

    // Performance threshold analysis
    this.analyzeThresholds();

    // Generate JSON report
    this.generateJSONReport();

    // Generate HTML report
    this.generateHTMLReport();

    console.log('\n📊 Reports generated:');
    console.log('   - performance-report.json');
    console.log('   - performance-report.html');
  }

  getThreshold(metricKey) {
    const key = metricKey.toLowerCase();
    
    if (key.includes('database') && key.includes('response')) {
      return PERFORMANCE_THRESHOLDS.databaseQueryTime;
    }
    if (key.includes('initialization') || key.includes('startup')) {
      return PERFORMANCE_THRESHOLDS.appStartupTime;
    }
    if (key.includes('navigation') || key.includes('switch')) {
      return PERFORMANCE_THRESHOLDS.navigationTime;
    }
    if (key.includes('connection')) {
      return PERFORMANCE_THRESHOLDS.connectionTime;
    }
    if (key.includes('memory')) {
      return PERFORMANCE_THRESHOLDS.memoryUsage;
    }
    
    return null;
  }

  formatMetric(key, value) {
    if (key.toLowerCase().includes('memory')) {
      if (value > 1024 * 1024) {
        return `${Math.round(value / 1024 / 1024)}MB`;
      } else if (value > 1024) {
        return `${Math.round(value / 1024)}KB`;
      } else {
        return `${value}B`;
      }
    } else {
      return `${value}ms`;
    }
  }

  analyzeThresholds() {
    console.log('🎯 Performance Threshold Analysis');
    console.log('==================================\n');

    const thresholdResults = [];

    this.results.forEach(result => {
      if (result.metrics) {
        Object.entries(result.metrics).forEach(([key, value]) => {
          const threshold = this.getThreshold(key);
          if (threshold) {
            const passed = value <= threshold;
            thresholdResults.push({
              test: result.name,
              metric: key,
              value,
              threshold,
              passed,
              percentage: Math.round((value / threshold) * 100)
            });
          }
        });
      }
    });

    // Group by requirement
    const requirements = {
      'Database Query Performance (< 100ms)': thresholdResults.filter(r => 
        r.metric.toLowerCase().includes('database') && r.metric.toLowerCase().includes('response')
      ),
      'App Startup Performance (< 2000ms)': thresholdResults.filter(r => 
        r.metric.toLowerCase().includes('initialization') || r.metric.toLowerCase().includes('startup')
      ),
      'Navigation Performance (< 200ms)': thresholdResults.filter(r => 
        r.metric.toLowerCase().includes('navigation') || r.metric.toLowerCase().includes('switch')
      ),
      'Memory Usage (< 100MB)': thresholdResults.filter(r => 
        r.metric.toLowerCase().includes('memory')
      )
    };

    Object.entries(requirements).forEach(([requirement, results]) => {
      if (results.length > 0) {
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const passRate = Math.round((passed / total) * 100);
        
        console.log(`${passRate === 100 ? '✅' : '⚠️'} ${requirement}`);
        console.log(`   Pass Rate: ${passed}/${total} (${passRate}%)`);
        
        results.forEach(result => {
          const status = result.passed ? '✅' : '❌';
          console.log(`   ${status} ${result.metric}: ${this.formatMetric(result.metric, result.value)} (${result.percentage}% of threshold)`);
        });
        
        console.log('');
      }
    });
  }

  generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'PASSED').length,
        failed: this.results.filter(r => r.status === 'FAILED').length,
        totalDuration: Date.now() - this.startTime
      },
      thresholds: PERFORMANCE_THRESHOLDS,
      results: this.results
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'performance-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SMARTIES Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4f8; padding: 15px; border-radius: 5px; flex: 1; }
        .test-result { margin: 20px 0; padding: 15px; border-left: 4px solid #ccc; }
        .passed { border-left-color: #4CAF50; }
        .failed { border-left-color: #f44336; }
        .metrics { margin: 10px 0; }
        .metric-item { margin: 5px 0; }
        .threshold-pass { color: #4CAF50; }
        .threshold-fail { color: #f44336; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SMARTIES Performance Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <p>${this.results.length}</p>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <p>${this.results.filter(r => r.status === 'PASSED').length}</p>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <p>${this.results.filter(r => r.status === 'FAILED').length}</p>
        </div>
        <div class="metric">
            <h3>Duration</h3>
            <p>${Date.now() - this.startTime}ms</p>
        </div>
    </div>

    <h2>Test Results</h2>
    ${this.results.map(result => `
        <div class="test-result ${result.status.toLowerCase()}">
            <h3>${result.name} - ${result.status}</h3>
            <p>Duration: ${result.duration}ms</p>
            ${result.metrics ? `
                <div class="metrics">
                    <h4>Performance Metrics:</h4>
                    ${Object.entries(result.metrics).map(([key, value]) => {
                      const threshold = this.getThreshold(key);
                      const passed = threshold ? value <= threshold : true;
                      return `
                        <div class="metric-item ${passed ? 'threshold-pass' : 'threshold-fail'}">
                            ${key}: ${this.formatMetric(key, value)}
                            ${threshold ? ` (Threshold: ${this.formatMetric(key, threshold)})` : ''}
                        </div>
                      `;
                    }).join('')}
                </div>
            ` : ''}
            ${result.error ? `<p style="color: red;">Error: ${result.error}</p>` : ''}
        </div>
    `).join('')}

    <h2>Performance Thresholds</h2>
    <ul>
        <li>Database Query Response Time: < ${PERFORMANCE_THRESHOLDS.databaseQueryTime}ms</li>
        <li>App Startup Time: < ${PERFORMANCE_THRESHOLDS.appStartupTime}ms</li>
        <li>Navigation Time: < ${PERFORMANCE_THRESHOLDS.navigationTime}ms</li>
        <li>Memory Usage: < ${Math.round(PERFORMANCE_THRESHOLDS.memoryUsage / 1024 / 1024)}MB</li>
        <li>Connection Time: < ${PERFORMANCE_THRESHOLDS.connectionTime}ms</li>
    </ul>
</body>
</html>
    `;

    fs.writeFileSync(
      path.join(process.cwd(), 'performance-report.html'),
      html
    );
  }
}

// Run performance tests if called directly
if (require.main === module) {
  const runner = new PerformanceTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Performance test runner failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTestRunner;