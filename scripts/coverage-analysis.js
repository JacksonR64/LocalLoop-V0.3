const fs = require('fs');
const path = require('path');

/**
 * Coverage Analysis Script
 * Analyzes test coverage data and generates comprehensive reports
 */

const COVERAGE_FILE = path.join(process.cwd(), 'coverage/coverage-summary.json');
const DETAILED_COVERAGE = path.join(process.cwd(), 'coverage/coverage-final.json');
const REPORTS_DIR = path.join(process.cwd(), 'reports');

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function loadCoverageData() {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error('❌ Coverage file not found. Run tests with coverage first: npm run coverage');
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
  const detailed = fs.existsSync(DETAILED_COVERAGE) 
    ? JSON.parse(fs.readFileSync(DETAILED_COVERAGE, 'utf8'))
    : null;

  return { summary, detailed };
}

function analyzeCoverage(summary, detailed) {
  const analysis = {
    timestamp: new Date().toISOString(),
    overall: summary.total,
    fileAnalysis: {},
    insights: {
      wellCovered: [],
      needsAttention: [],
      uncovered: [],
      trends: {}
    },
    recommendations: []
  };

  // Analyze each file
  Object.entries(summary).forEach(([filePath, coverage]) => {
    if (filePath === 'total') return;

    const relativePath = filePath.replace(process.cwd(), '');
    const fileAnalysis = {
      path: relativePath,
      coverage,
      score: calculateCoverageScore(coverage),
      category: categorizeCoverage(coverage),
      issues: identifyIssues(coverage, detailed?.[filePath])
    };

    analysis.fileAnalysis[relativePath] = fileAnalysis;

    // Categorize files based on coverage
    if (fileAnalysis.score >= 90) {
      analysis.insights.wellCovered.push(fileAnalysis);
    } else if (fileAnalysis.score >= 70) {
      analysis.insights.needsAttention.push(fileAnalysis);
    } else {
      analysis.insights.uncovered.push(fileAnalysis);
    }
  });

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
}

function calculateCoverageScore(coverage) {
  return Math.round(
    (coverage.lines.pct + coverage.functions.pct + coverage.branches.pct + coverage.statements.pct) / 4
  );
}

function categorizeCoverage(coverage) {
  const score = calculateCoverageScore(coverage);
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'fair';
  if (score >= 50) return 'poor';
  return 'critical';
}

function identifyIssues(coverage, detailedData) {
  const issues = [];

  if (coverage.lines.pct < 80) {
    issues.push({
      type: 'lines',
      message: `Line coverage is ${coverage.lines.pct}% (target: 80%)`,
      severity: coverage.lines.pct < 50 ? 'high' : 'medium'
    });
  }

  if (coverage.branches.pct < 75) {
    issues.push({
      type: 'branches',
      message: `Branch coverage is ${coverage.branches.pct}% (target: 75%)`,
      severity: coverage.branches.pct < 50 ? 'high' : 'medium'
    });
  }

  if (coverage.functions.pct < 80) {
    issues.push({
      type: 'functions',
      message: `Function coverage is ${coverage.functions.pct}% (target: 80%)`,
      severity: coverage.functions.pct < 50 ? 'high' : 'medium'
    });
  }

  return issues;
}

function generateRecommendations(analysis) {
  const recommendations = [];

  // Overall recommendations
  const overall = analysis.overall;
  if (overall.lines.pct < 80) {
    recommendations.push({
      priority: 'high',
      category: 'coverage',
      message: `Increase overall line coverage from ${overall.lines.pct}% to 80%`,
      action: 'Add tests for uncovered lines in critical files'
    });
  }

  if (overall.branches.pct < 75) {
    recommendations.push({
      priority: 'high',
      category: 'coverage',
      message: `Increase branch coverage from ${overall.branches.pct}% to 75%`,
      action: 'Add tests for conditional logic and error handling paths'
    });
  }

  // File-specific recommendations
  analysis.insights.uncovered
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .forEach(file => {
      recommendations.push({
        priority: 'medium',
        category: 'file',
        message: `${file.path} has low coverage (${file.score}%)`,
        action: `Add comprehensive tests for ${file.path}`
      });
    });

  // Component-specific recommendations
  const componentFiles = Object.values(analysis.fileAnalysis)
    .filter(file => file.path.includes('/components/'))
    .filter(file => file.score < 75);

  if (componentFiles.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'components',
      message: `${componentFiles.length} component(s) need better test coverage`,
      action: 'Add React Testing Library tests for user interactions and edge cases'
    });
  }

  // API route recommendations
  const apiFiles = Object.values(analysis.fileAnalysis)
    .filter(file => file.path.includes('/api/'))
    .filter(file => file.score < 80);

  if (apiFiles.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'api',
      message: `${apiFiles.length} API route(s) need better test coverage`,
      action: 'Add integration tests for API endpoints, error handling, and edge cases'
    });
  }

  return recommendations;
}

function generateReport(analysis) {
  ensureReportsDir();

  // Save detailed analysis
  const analysisFile = path.join(REPORTS_DIR, 'coverage-analysis.json');
  fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));

  // Generate markdown report
  generateMarkdownReport(analysis);

  // Generate CSV for data analysis
  generateCSVReport(analysis);

  // Print summary to console
  printSummary(analysis);

  console.log(`\n📊 Coverage analysis complete! Reports saved to:`);
  console.log(`   - JSON: ${analysisFile}`);
  console.log(`   - Markdown: ${path.join(REPORTS_DIR, 'coverage-report.md')}`);
  console.log(`   - CSV: ${path.join(REPORTS_DIR, 'coverage-data.csv')}`);
}

function generateMarkdownReport(analysis) {
  const reportFile = path.join(REPORTS_DIR, 'coverage-report.md');
  
  let content = `# Test Coverage Analysis Report\n\n`;
  content += `**Generated:** ${new Date(analysis.timestamp).toLocaleString()}\n\n`;

  // Overall Coverage Summary
  content += `## 📊 Overall Coverage\n\n`;
  content += `| Metric | Coverage | Target | Status |\n`;
  content += `|--------|----------|--------|---------|\n`;
  content += `| Lines | ${analysis.overall.lines.pct}% | 80% | ${analysis.overall.lines.pct >= 80 ? '✅' : '❌'} |\n`;
  content += `| Functions | ${analysis.overall.functions.pct}% | 80% | ${analysis.overall.functions.pct >= 80 ? '✅' : '❌'} |\n`;
  content += `| Branches | ${analysis.overall.branches.pct}% | 75% | ${analysis.overall.branches.pct >= 75 ? '✅' : '❌'} |\n`;
  content += `| Statements | ${analysis.overall.statements.pct}% | 80% | ${analysis.overall.statements.pct >= 80 ? '✅' : '❌'} |\n\n`;

  // File Analysis
  content += `## 📁 File Coverage Analysis\n\n`;
  
  if (analysis.insights.wellCovered.length > 0) {
    content += `### ✅ Well Covered Files (90+)\n\n`;
    analysis.insights.wellCovered.slice(0, 10).forEach(file => {
      content += `- **${file.path}** (${file.score}%)\n`;
    });
    content += `\n`;
  }

  if (analysis.insights.needsAttention.length > 0) {
    content += `### ⚠️ Files Needing Attention (70-89%)\n\n`;
    analysis.insights.needsAttention.slice(0, 10).forEach(file => {
      content += `- **${file.path}** (${file.score}%)\n`;
      if (file.issues.length > 0) {
        file.issues.forEach(issue => {
          content += `  - ${issue.type}: ${issue.message}\n`;
        });
      }
    });
    content += `\n`;
  }

  if (analysis.insights.uncovered.length > 0) {
    content += `### ❌ Poorly Covered Files (<70%)\n\n`;
    analysis.insights.uncovered.slice(0, 15).forEach(file => {
      content += `- **${file.path}** (${file.score}%)\n`;
      if (file.issues.length > 0) {
        file.issues.forEach(issue => {
          content += `  - ${issue.type}: ${issue.message}\n`;
        });
      }
    });
    content += `\n`;
  }

  // Recommendations
  content += `## 🎯 Recommendations\n\n`;
  analysis.recommendations.forEach((rec, index) => {
    const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
    content += `${index + 1}. ${priority} **${rec.category.toUpperCase()}**: ${rec.message}\n`;
    content += `   - **Action**: ${rec.action}\n\n`;
  });

  fs.writeFileSync(reportFile, content);
}

function generateCSVReport(analysis) {
  const csvFile = path.join(REPORTS_DIR, 'coverage-data.csv');
  
  let csv = 'File,Lines %,Functions %,Branches %,Statements %,Overall Score,Category\n';
  
  Object.values(analysis.fileAnalysis).forEach(file => {
    csv += `"${file.path}",${file.coverage.lines.pct},${file.coverage.functions.pct},${file.coverage.branches.pct},${file.coverage.statements.pct},${file.score},${file.category}\n`;
  });

  fs.writeFileSync(csvFile, csv);
}

function printSummary(analysis) {
  console.log('\n📊 Coverage Analysis Summary');
  console.log('=' .repeat(50));
  
  const overall = analysis.overall;
  console.log(`Overall Coverage:`);
  console.log(`  Lines:      ${overall.lines.pct}% ${overall.lines.pct >= 80 ? '✅' : '❌'}`);
  console.log(`  Functions:  ${overall.functions.pct}% ${overall.functions.pct >= 80 ? '✅' : '❌'}`);
  console.log(`  Branches:   ${overall.branches.pct}% ${overall.branches.pct >= 75 ? '✅' : '❌'}`);
  console.log(`  Statements: ${overall.statements.pct}% ${overall.statements.pct >= 80 ? '✅' : '❌'}`);

  console.log(`\nFile Categories:`);
  console.log(`  ✅ Well covered (90%+): ${analysis.insights.wellCovered.length} files`);
  console.log(`  ⚠️  Needs attention (70-89%): ${analysis.insights.needsAttention.length} files`);
  console.log(`  ❌ Poor coverage (<70%): ${analysis.insights.uncovered.length} files`);

  console.log(`\nTop Recommendations:`);
  analysis.recommendations.slice(0, 3).forEach((rec, index) => {
    const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
    console.log(`  ${index + 1}. ${priority} ${rec.message}`);
  });
}

function main() {
  try {
    console.log('🔍 Analyzing test coverage...');
    
    const { summary, detailed } = loadCoverageData();
    const analysis = analyzeCoverage(summary, detailed);
    
    generateReport(analysis);
    
  } catch (error) {
    console.error('❌ Error analyzing coverage:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeCoverage,
  generateReport,
  calculateCoverageScore,
  categorizeCoverage
}; 