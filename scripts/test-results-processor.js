const fs = require('fs');
const path = require('path');

/**
 * Enhanced Test Results Processor
 * Processes Jest test results for detailed reporting and analytics
 */
module.exports = (results) => {
  // Ensure reports directory exists
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Process test results
  const processedResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.numTotalTests,
      passed: results.numPassedTests,
      failed: results.numFailedTests,
      pending: results.numPendingTests,
      runtime: results.testResults.reduce((total, result) => total + result.perfStats.runtime, 0),
      coverage: results.coverageMap ? extractCoverageSummary(results.coverageMap) : null
    },
    testFiles: results.testResults.map(result => ({
      file: result.testFilePath.replace(process.cwd(), ''),
      status: result.numFailingTests > 0 ? 'failed' : 'passed',
      tests: result.numPassingTests + result.numFailingTests,
      passed: result.numPassingTests,
      failed: result.numFailingTests,
      runtime: result.perfStats.runtime,
      coverage: result.coverage ? extractFileCoverage(result.coverage) : null,
      slowTests: result.testResults
        .filter(test => test.duration > 1000) // Tests taking more than 1 second
        .map(test => ({
          name: test.fullName,
          duration: test.duration
        }))
    })),
    performance: {
      slowestTests: results.testResults
        .flatMap(result => result.testResults.map(test => ({
          file: result.testFilePath.replace(process.cwd(), ''),
          name: test.fullName,
          duration: test.duration
        })))
        .filter(test => test.duration > 500)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      averageTestDuration: calculateAverageTestDuration(results.testResults),
      totalRuntime: results.testResults.reduce((total, result) => total + result.perfStats.runtime, 0)
    },
    trends: generateTrends(results)
  };

  // Save detailed results
  const detailedReport = path.join(reportsDir, 'test-results-detailed.json');
  fs.writeFileSync(detailedReport, JSON.stringify(processedResults, null, 2));

  // Save summary for CI
  const summaryReport = path.join(reportsDir, 'test-summary.json');
  fs.writeFileSync(summaryReport, JSON.stringify(processedResults.summary, null, 2));

  // Generate markdown report
  generateMarkdownReport(processedResults, reportsDir);

  // Generate coverage badge data
  if (processedResults.summary.coverage) {
    generateCoverageBadge(processedResults.summary.coverage, reportsDir);
  }

  console.log(`📊 Test reports generated in ${reportsDir}`);
  console.log(`📈 Coverage: ${processedResults.summary.coverage?.overall?.pct || 'N/A'}%`);
  console.log(`⏱️  Total runtime: ${(processedResults.performance.totalRuntime / 1000).toFixed(2)}s`);

  return results;
};

function extractCoverageSummary(coverageMap) {
  if (!coverageMap || !coverageMap.getCoverageSummary) {
    return null;
  }

  const summary = coverageMap.getCoverageSummary();
  return {
    overall: {
      lines: summary.lines.pct,
      functions: summary.functions.pct,
      branches: summary.branches.pct,
      statements: summary.statements.pct,
      pct: Math.round((summary.lines.pct + summary.functions.pct + summary.branches.pct + summary.statements.pct) / 4)
    },
    details: {
      lines: { covered: summary.lines.covered, total: summary.lines.total, pct: summary.lines.pct },
      functions: { covered: summary.functions.covered, total: summary.functions.total, pct: summary.functions.pct },
      branches: { covered: summary.branches.covered, total: summary.branches.total, pct: summary.branches.pct },
      statements: { covered: summary.statements.covered, total: summary.statements.total, pct: summary.statements.pct }
    }
  };
}

function extractFileCoverage(coverage) {
  return {
    lines: coverage.getLineCoverage ? coverage.getLineCoverage() : {},
    functions: coverage.getFunctionCoverage ? coverage.getFunctionCoverage() : {},
    branches: coverage.getBranchCoverage ? coverage.getBranchCoverage() : {},
    statements: coverage.getStatementCoverage ? coverage.getStatementCoverage() : {}
  };
}

function calculateAverageTestDuration(testResults) {
  const allTests = testResults.flatMap(result => result.testResults);
  const totalDuration = allTests.reduce((sum, test) => sum + (test.duration || 0), 0);
  return allTests.length > 0 ? Math.round(totalDuration / allTests.length) : 0;
}

function generateTrends(results) {
  // Basic trend analysis - can be enhanced with historical data
  return {
    testCount: results.numTotalTests,
    passRate: results.numTotalTests > 0 ? (results.numPassedTests / results.numTotalTests * 100) : 0,
    runtime: results.testResults.reduce((total, result) => total + result.perfStats.runtime, 0),
    timestamp: new Date().toISOString()
  };
}

function generateMarkdownReport(results, reportsDir) {
  const markdown = `# Test Coverage Report

Generated: ${new Date(results.timestamp).toLocaleString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${results.summary.total} |
| Passed | ${results.summary.passed} ✅ |
| Failed | ${results.summary.failed} ${results.summary.failed > 0 ? '❌' : '✅'} |
| Pending | ${results.summary.pending} |
| Pass Rate | ${results.summary.total > 0 ? Math.round(results.summary.passed / results.summary.total * 100) : 0}% |
| Runtime | ${(results.summary.runtime / 1000).toFixed(2)}s |

${results.summary.coverage ? `## Coverage

| Type | Coverage |
|------|----------|
| Lines | ${results.summary.coverage.overall.lines}% |
| Functions | ${results.summary.coverage.overall.functions}% |
| Branches | ${results.summary.coverage.overall.branches}% |
| Statements | ${results.summary.coverage.overall.statements}% |
| **Overall** | **${results.summary.coverage.overall.pct}%** |

` : ''}

## Performance

- Average test duration: ${results.performance.averageTestDuration}ms
- Total runtime: ${(results.performance.totalRuntime / 1000).toFixed(2)}s

### Slowest Tests

${results.performance.slowestTests.map(test => 
  `- \`${test.name}\` - ${test.duration}ms (${test.file})`
).join('\n')}

## Test Files

${results.testFiles.map(file => 
  `- **${file.file}** - ${file.status} (${file.passed}/${file.tests} passed, ${file.runtime}ms)`
).join('\n')}

---
*Report generated by LocalLoop Test Suite*
`;

  fs.writeFileSync(path.join(reportsDir, 'test-report.md'), markdown);
}

function generateCoverageBadge(coverage, reportsDir) {
  const pct = coverage.overall.pct;
  let color = 'red';
  
  if (pct >= 90) color = 'brightgreen';
  else if (pct >= 80) color = 'green';
  else if (pct >= 70) color = 'yellow';
  else if (pct >= 60) color = 'orange';

  const badge = {
    schemaVersion: 1,
    label: 'coverage',
    message: `${pct}%`,
    color: color
  };

  fs.writeFileSync(path.join(reportsDir, 'coverage-badge.json'), JSON.stringify(badge, null, 2));
} 