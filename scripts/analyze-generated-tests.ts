#!/usr/bin/env tsx

import { AnalysisAgentG } from '../src/agents/analysis-agent-g';
import { PlaywrightTest, ValidatedScenario } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Standalone script to analyze existing generated tests
 */
async function analyzeGeneratedTests(): Promise<void> {
  console.log('Analyzing existing generated tests...\n');

  const testsDir = path.join(__dirname, '../tests/generated');
  
  if (!fs.existsSync(testsDir)) {
    console.log('ERROR: No generated tests directory found. Run test generation first.');
    process.exit(1);
  }

  // Find all test files
  const testFiles = fs.readdirSync(testsDir)
    .filter(file => file.endsWith('.spec.ts'))
    .map(filename => {
      const content = fs.readFileSync(path.join(testsDir, filename), 'utf-8');
      return { filename, content };
    });

  if (testFiles.length === 0) {
    console.log('ERROR: No test files found in generated directory.');
    process.exit(1);
  }

  console.log(`Found ${testFiles.length} test files to analyze:`);
  testFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.filename}`);
  });

  // Create dummy scenarios for analysis (since we don't have the original scenarios)
  const dummyScenarios: ValidatedScenario[] = testFiles.map(file => ({
    title: file.filename.replace('.spec.ts', '').replace(/-/g, ' '),
    description: `Generated test scenario for ${file.filename}`,
    type: 'positive',
    device: file.filename.includes('mobile') ? 'mobile' : 'desktop',
    selectors: {},
    api_endpoints: []
  }));

  // Initialize Agent G
  const agentG = new AnalysisAgentG();

  try {
    // Analyze tests and generate report
    console.log('\nStarting comprehensive analysis...');
    const report = await agentG.analyzeTestsAndGenerateReport(testFiles, dummyScenarios);

    console.log('\nAnalysis complete!');
    console.log(`\nEngineer Review Summary:`);
    console.log(`   Report: ${report.reportPath}`);
    console.log(`   Average Quality Score: ${report.summary.averageQualityScore}/100`);
    console.log(`   Total Issues: ${report.summary.totalIssues}`);
    console.log(`   Ready to Run: ${report.summary.readyForExecution}/${report.summary.totalTests} tests`);
    console.log(`   Need Attention: ${report.summary.testsNeedingAttention} tests`);
    console.log(`   Priority Actions: ${report.prioritizedActions.length}`);

    console.log(`\nTest-by-Test Breakdown:`);
    report.testAnalyses.forEach((analysis, index) => {
      const statusIndicator = analysis.overallScore >= 80 ? 'PASS' : 
                         analysis.overallScore >= 60 ? 'WARN' : 'FAIL';
      
      console.log(`   [${statusIndicator}] ${analysis.filename}: ${analysis.overallScore}/100`);
      
      if (analysis.syntaxErrors.length > 0) {
        console.log(`      SYNTAX: ${analysis.syntaxErrors.length} syntax errors`);
      }
      if (analysis.playwrightApiIssues.length > 0) {
        console.log(`      API: ${analysis.playwrightApiIssues.length} API issues`);
      }
      if (analysis.selectorQualityIssues.length > 0) {
        console.log(`      SELECTORS: ${analysis.selectorQualityIssues.length} selector issues`);
      }
    });

    console.log(`\nNext Steps:`);
    console.log(`   1. Review the detailed report: ${report.reportPath}`);
    console.log(`   2. Fix high-priority issues first (syntax errors)`);
    console.log(`   3. Address API and selector issues`);
    console.log(`   4. Run tests after fixes: npm run test`);

    if (report.summary.totalIssues === 0) {
      console.log(`\nCongratulations! All tests look good and are ready to run!`);
    } else if (report.summary.readyForExecution === report.summary.totalTests) {
      console.log(`\nAll tests are syntactically correct and ready to run!`);
      console.log(`Consider addressing the remaining issues for better maintainability.`);
    } else {
      console.log(`\nWARNING: Some tests have blocking issues and need fixes before execution.`);
    }

  } catch (error) {
    console.error('ERROR: Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  analyzeGeneratedTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
