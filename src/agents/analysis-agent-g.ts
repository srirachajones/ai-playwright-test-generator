import { PlaywrightTest, ValidatedScenario } from '../types';
import { LangChainClient } from '../llm/langchain-client';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Agent G: Comprehensive Test Analysis & Engineer Report Generation
 * Analyzes generated tests and creates detailed reports for manual engineer review
 */
export class AnalysisAgentG {
  private llmClient: LangChainClient;

  constructor(llmClient?: LangChainClient) {
    this.llmClient = llmClient || new LangChainClient();
  }

  /**
   * Analyze all generated tests and create comprehensive engineer report
   */
  async analyzeTestsAndGenerateReport(
    tests: PlaywrightTest[], 
    scenarios: ValidatedScenario[]
  ): Promise<EngineerReviewReport> {
    console.log('Agent G: Starting comprehensive test analysis...');

    const analysisResults = await Promise.all(
      tests.map(test => this.analyzeIndividualTest(test))
    );

    const report = await this.generateComprehensiveReport(
      tests,
      scenarios,
      analysisResults
    );

    // Save report to file
    await this.saveReportToFile(report);

    console.log(`Agent G: Analysis complete. Report saved to: ${report.reportPath}`);
    return report;
  }

  /**
   * Analyze individual test file for syntax errors, best practices, and issues
   */
  private async analyzeIndividualTest(test: PlaywrightTest): Promise<TestAnalysisResult> {
    console.log(`Analyzing: ${test.filename}`);

    const analysis: TestAnalysisResult = {
      filename: test.filename,
      syntaxErrors: [],
      warningsAndBestPractices: [],
      playwrightApiIssues: [],
      selectorQualityIssues: [],
      performanceIssues: [],
      maintainabilityIssues: [],
      overallScore: 0,
      recommendedFixes: []
    };

    // 1. TypeScript Syntax Analysis
    analysis.syntaxErrors = this.analyzeSyntaxErrors(test.content);

    // 2. Playwright API Usage Analysis
    analysis.playwrightApiIssues = this.analyzePlaywrightAPI(test.content);

    // 3. Selector Quality Analysis
    analysis.selectorQualityIssues = this.analyzeSelectorQuality(test.content);

    // 4. Performance Analysis
    analysis.performanceIssues = this.analyzePerformanceIssues(test.content);

    // 5. Maintainability Analysis
    analysis.maintainabilityIssues = this.analyzeMaintainabilityIssues(test.content);

    // 6. Best Practices Analysis
    analysis.warningsAndBestPractices = this.analyzeBestPractices(test.content);

    // 7. Generate LLM-powered recommendations
    analysis.recommendedFixes = await this.generateLLMRecommendations(test, analysis);

    // 8. Calculate overall quality score
    analysis.overallScore = this.calculateQualityScore(analysis);

    return analysis;
  }

  /**
   * Analyze TypeScript syntax errors using compiler API with project's tsconfig.json
   */
  private analyzeSyntaxErrors(content: string): SyntaxError[] {
    const errors: SyntaxError[] = [];
    
    try {
      // Load project's tsconfig.json
      const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
      let compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        noEmit: true,
        noResolve: false,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        types: ['node', '@playwright/test'],
        baseUrl: '.',
        paths: {
          '@/*': ['src/*'],
          '@pages/*': ['src/pages/*'],
          '@utils/*': ['src/utils/*']
        }
      };

      if (configPath) {
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        if (!configFile.error) {
          const parsedConfig = ts.parseJsonConfigFileContent(
            configFile.config,
            ts.sys,
            path.dirname(configPath)
          );
          // Merge options but preserve our critical settings
          compilerOptions = { 
            ...compilerOptions, 
            ...parsedConfig.options,
            // Ensure these are always set for proper analysis
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            types: ['node', '@playwright/test'],
            skipLibCheck: true,
            skipDefaultLibCheck: true,
            noEmit: true
          };
        }
      }

      const sourceFile = ts.createSourceFile(
        'temp.ts',
        content,
        compilerOptions.target || ts.ScriptTarget.ES2020,
        true
      );

      // Create a more realistic compiler host with proper path mapping support
      const host: ts.CompilerHost = {
        getSourceFile: (fileName) => {
          if (fileName === 'temp.ts') return sourceFile;
          
          // Handle path mappings (@pages, @utils, @/*)
          let resolvedFileName = fileName;
          if (fileName.startsWith('@pages/')) {
            resolvedFileName = path.join(process.cwd(), 'src/pages', fileName.replace('@pages/', ''));
          } else if (fileName.startsWith('@utils/')) {
            resolvedFileName = path.join(process.cwd(), 'src/utils', fileName.replace('@utils/', ''));
          } else if (fileName.startsWith('@/')) {
            resolvedFileName = path.join(process.cwd(), 'src', fileName.replace('@/', ''));
          }
          
          // Try to read actual project files for better type checking
          if (ts.sys.fileExists(resolvedFileName)) {
            const fileContent = ts.sys.readFile(resolvedFileName);
            if (fileContent) {
              return ts.createSourceFile(fileName, fileContent, compilerOptions.target || ts.ScriptTarget.ES2020);
            }
          }
          
          // Try to read TypeScript definition files from node_modules
          if (fileName.includes('node_modules') || fileName.includes('@playwright') || fileName.includes('@types')) {
            if (ts.sys.fileExists(fileName)) {
              const fileContent = ts.sys.readFile(fileName);
              if (fileContent) {
                return ts.createSourceFile(fileName, fileContent, compilerOptions.target || ts.ScriptTarget.ES2020);
              }
            }
          }
          
          return undefined;
        },
        writeFile: () => {},
        getCurrentDirectory: () => process.cwd(),
        getDirectories: ts.sys.getDirectories,
        fileExists: (fileName) => {
          // Handle path mappings for file existence checks
          if (fileName.startsWith('@pages/')) {
            const resolvedPath = path.join(process.cwd(), 'src/pages', fileName.replace('@pages/', ''));
            return ts.sys.fileExists(resolvedPath);
          } else if (fileName.startsWith('@utils/')) {
            const resolvedPath = path.join(process.cwd(), 'src/utils', fileName.replace('@utils/', ''));
            return ts.sys.fileExists(resolvedPath);
          } else if (fileName.startsWith('@/')) {
            const resolvedPath = path.join(process.cwd(), 'src', fileName.replace('@/', ''));
            return ts.sys.fileExists(resolvedPath);
          }
          return ts.sys.fileExists(fileName);
        },
        readFile: (fileName) => {
          // Handle path mappings for file reading
          if (fileName.startsWith('@pages/')) {
            const resolvedPath = path.join(process.cwd(), 'src/pages', fileName.replace('@pages/', ''));
            return ts.sys.readFile(resolvedPath);
          } else if (fileName.startsWith('@utils/')) {
            const resolvedPath = path.join(process.cwd(), 'src/utils', fileName.replace('@utils/', ''));
            return ts.sys.readFile(resolvedPath);
          } else if (fileName.startsWith('@/')) {
            const resolvedPath = path.join(process.cwd(), 'src', fileName.replace('@/', ''));
            return ts.sys.readFile(resolvedPath);
          }
          return ts.sys.readFile(fileName);
        },
        getCanonicalFileName: (fileName) => fileName,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => ts.sys.newLine,
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        resolveModuleNames: (moduleNames, containingFile) => {
          return moduleNames.map(moduleName => {
            // Handle custom path mappings
            if (moduleName === '@pages') {
              return {
                resolvedFileName: path.join(process.cwd(), 'src/pages/index.ts'),
                isExternalLibraryImport: false
              };
            } else if (moduleName.startsWith('@pages/')) {
              const relativePath = moduleName.replace('@pages/', '');
              return {
                resolvedFileName: path.join(process.cwd(), 'src/pages', relativePath + '.ts'),
                isExternalLibraryImport: false
              };
            } else if (moduleName.startsWith('@utils/')) {
              const relativePath = moduleName.replace('@utils/', '');
              return {
                resolvedFileName: path.join(process.cwd(), 'src/utils', relativePath + '.ts'),
                isExternalLibraryImport: false
              };
            } else if (moduleName.startsWith('@/')) {
              const relativePath = moduleName.replace('@/', '');
              return {
                resolvedFileName: path.join(process.cwd(), 'src', relativePath + '.ts'),
                isExternalLibraryImport: false
              };
            }
            
            // Use standard module resolution for other modules
            const result = ts.resolveModuleName(moduleName, containingFile, compilerOptions, ts.sys);
            return result.resolvedModule;
          });
        }
      };

      const program = ts.createProgram(['temp.ts'], compilerOptions, host);
      const diagnostics = ts.getPreEmitDiagnostics(program);

      diagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          
          // Filter out false positive DOM-related errors for Playwright tests
          if (this.shouldIgnoreDiagnostic(message, content)) {
            return; // Skip this diagnostic
          }
          
          errors.push({
            line: line + 1,
            character: character + 1,
            message,
            severity: 'error',
            code: diagnostic.code
          });
        }
      });
    } catch (error) {
      errors.push({
        line: 1,
        character: 1,
        message: `TypeScript compilation failed: ${error}`,
        severity: 'error',
        code: -1
      });
    }

    return errors;
  }

  /**
   * Determine if a TypeScript diagnostic should be ignored for Playwright tests
   */
  private shouldIgnoreDiagnostic(message: string, content: string): boolean {
    // Ignore DOM-related errors if the test doesn't actually use DOM APIs directly
    const domErrors = [
      "Cannot find name 'document'",
      "Cannot find name 'HTMLElement'",
      "Cannot find name 'HTMLInputElement'",
      "Cannot find name 'window'",
      "Cannot find name 'Element'"
    ];
    
    if (domErrors.some(error => message.includes(error))) {
      // Check if the test actually uses these DOM APIs directly
      const hasDOMUsage = content.includes('document.') || 
                         content.includes('window.') ||
                         content.includes('HTMLElement') ||
                         content.includes('HTMLInputElement');
      
      // If no direct DOM usage, ignore these errors (likely false positives)
      if (!hasDOMUsage) {
        return true;
      }
    }
    
    // Ignore path mapping errors that we know are resolved at runtime
    const pathMappingErrors = [
      "Cannot find module '@pages'",
      "Cannot find module '@utils'",
      "Cannot find module '@/'"
    ];
    
    if (pathMappingErrors.some(error => message.includes(error))) {
      return true;
    }
    
    return false;
  }

  /**
   * Analyze Playwright API usage patterns
   */
  private analyzePlaywrightAPI(content: string): PlaywrightAPIIssue[] {
    const issues: PlaywrightAPIIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for deprecated APIs
      if (line.includes('page.waitForSelector(')) {
        issues.push({
          line: lineNum,
          type: 'deprecated_api',
          message: 'waitForSelector() is deprecated, use locator.waitFor() instead',
          severity: 'warning',
          suggestion: 'Replace with: await page.locator(selector).waitFor()'
        });
      }

      // Check for missing await keywords
      if (line.includes('page.') && !line.includes('await') && !line.includes('return')) {
        issues.push({
          line: lineNum,
          type: 'missing_await',
          message: 'Playwright method call missing await keyword',
          severity: 'error',
          suggestion: 'Add await before Playwright method calls'
        });
      }

      // Check for inefficient selectors
      if (line.includes('page.locator(') && line.includes('nth(')) {
        issues.push({
          line: lineNum,
          type: 'inefficient_selector',
          message: 'Using nth() selector which can be brittle',
          severity: 'warning',
          suggestion: 'Consider using more specific selectors like getByRole() or getByTestId()'
        });
      }

      // Check for missing error handling
      if (line.includes('.click()') && !content.includes('try') && !content.includes('catch')) {
        issues.push({
          line: lineNum,
          type: 'missing_error_handling',
          message: 'Interactive actions should have error handling',
          severity: 'info',
          suggestion: 'Consider wrapping in try-catch or using soft assertions'
        });
      }
    });

    return issues;
  }

  /**
   * Analyze selector quality and robustness
   */
  private analyzeSelectorQuality(content: string): SelectorQualityIssue[] {
    const issues: SelectorQualityIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for brittle selectors
      if (line.includes('css=') || line.includes('xpath=')) {
        issues.push({
          line: lineNum,
          type: 'brittle_selector',
          message: 'CSS/XPath selectors are brittle and hard to maintain',
          severity: 'warning',
          robustnessScore: 3,
          suggestion: 'Use semantic selectors like getByRole(), getByLabel(), or getByTestId()'
        });
      }

      // Check for class-based selectors
      if (line.includes('.locator(') && line.includes('.')) {
        issues.push({
          line: lineNum,
          type: 'class_based_selector',
          message: 'Class-based selectors can break with CSS changes',
          severity: 'info',
          robustnessScore: 5,
          suggestion: 'Consider using data-testid or semantic selectors'
        });
      }

      // Check for text-based selectors without proper escaping
      if (line.includes('text=') && !line.includes('/i')) {
        issues.push({
          line: lineNum,
          type: 'case_sensitive_text',
          message: 'Text selector is case-sensitive',
          severity: 'info',
          robustnessScore: 6,
          suggestion: 'Use case-insensitive regex: /text/i'
        });
      }

      // Positive: Good selector usage
      if (line.includes('getByRole(') || line.includes('getByTestId(') || line.includes('getByLabel(')) {
        issues.push({
          line: lineNum,
          type: 'good_selector',
          message: 'Good use of semantic selector',
          severity: 'success',
          robustnessScore: 9,
          suggestion: 'Keep using semantic selectors for better maintainability'
        });
      }
    });

    return issues;
  }

  /**
   * Analyze performance-related issues
   */
  private analyzePerformanceIssues(content: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for excessive waits
      if (line.includes('waitForTimeout') && line.includes('5000')) {
        issues.push({
          line: lineNum,
          type: 'excessive_wait',
          message: 'Long timeout may slow down test execution',
          severity: 'warning',
          impact: 'medium',
          suggestion: 'Use specific waitFor conditions instead of fixed timeouts'
        });
      }

      // Check for networkidle usage
      if (line.includes('networkidle')) {
        issues.push({
          line: lineNum,
          type: 'networkidle_usage',
          message: 'networkidle can cause unnecessary delays',
          severity: 'info',
          impact: 'low',
          suggestion: 'Consider using domcontentloaded or specific element waits'
        });
      }

      // Check for multiple page navigations
      const navigateCount = content.split('goto(').length - 1;
      if (navigateCount > 1) {
        issues.push({
          line: lineNum,
          type: 'multiple_navigations',
          message: 'Multiple page navigations detected',
          severity: 'info',
          impact: 'medium',
          suggestion: 'Consider combining related actions in single page context'
        });
      }
    });

    return issues;
  }

  /**
   * Analyze maintainability issues
   */
  private analyzeMaintainabilityIssues(content: string): MaintainabilityIssue[] {
    const issues: MaintainabilityIssue[] = [];
    const lines = content.split('\n');

    // Check for hardcoded values
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (line.includes('fill(') && (line.includes('"test') || line.includes("'test"))) {
        issues.push({
          line: lineNum,
          type: 'hardcoded_values',
          message: 'Hardcoded test data detected',
          severity: 'warning',
          suggestion: 'Use test data from configuration or fixtures'
        });
      }

      if (line.includes('expect(') && line.includes('toBe(') && line.includes('"')) {
        issues.push({
          line: lineNum,
          type: 'hardcoded_assertions',
          message: 'Hardcoded assertion values',
          severity: 'info',
          suggestion: 'Consider using dynamic assertions or constants'
        });
      }
    });

    // Check for test structure
    const hasDescribe = content.includes('test.describe(');
    const hasBeforeEach = content.includes('test.beforeEach(');
    const hasAfterEach = content.includes('test.afterEach(');

    if (!hasDescribe) {
      issues.push({
        line: 1,
        type: 'missing_describe_block',
        message: 'Missing test.describe() block for better organization',
        severity: 'info',
        suggestion: 'Wrap related tests in describe blocks'
      });
    }

    return issues;
  }

  /**
   * Analyze best practices compliance
   */
  private analyzeBestPractices(content: string): BestPracticeIssue[] {
    const issues: BestPracticeIssue[] = [];
    const lines = content.split('\n');

    // Check for proper imports
    if (!content.includes("import { test, expect } from '@playwright/test'")) {
      issues.push({
        line: 1,
        type: 'missing_imports',
        message: 'Missing proper Playwright imports',
        severity: 'error',
        suggestion: "Add: import { test, expect } from '@playwright/test'"
      });
    }

    // Check for test isolation
    if (content.includes('test.only(')) {
      issues.push({
        line: content.indexOf('test.only('),
        type: 'test_only_usage',
        message: 'test.only() found - should not be committed',
        severity: 'warning',
        suggestion: 'Replace test.only() with test()'
      });
    }

    // Check for proper assertions
    const assertionCount = (content.match(/expect\(/g) || []).length;
    if (assertionCount === 0) {
      issues.push({
        line: 1,
        type: 'no_assertions',
        message: 'No assertions found in test',
        severity: 'error',
        suggestion: 'Add expect() assertions to verify test outcomes'
      });
    }

    return issues;
  }

  /**
   * Generate LLM-powered recommendations for fixes
   */
  private async generateLLMRecommendations(
    test: PlaywrightTest, 
    analysis: TestAnalysisResult
  ): Promise<string[]> {
    try {
      const totalIssues = analysis.syntaxErrors.length + 
                         analysis.playwrightApiIssues.length + 
                         analysis.selectorQualityIssues.length;

      if (totalIssues === 0) {
        return ['Test looks good! No major issues detected.'];
      }

      const systemPrompt = `You are a senior QA engineer reviewing Playwright test code. Provide specific, actionable recommendations for fixing issues.`;
      
      const userPrompt = `TEST FILE: ${test.filename}

DETECTED ISSUES:
- Syntax Errors: ${analysis.syntaxErrors.length}
- Playwright API Issues: ${analysis.playwrightApiIssues.length}  
- Selector Quality Issues: ${analysis.selectorQualityIssues.length}
- Performance Issues: ${analysis.performanceIssues.length}

TOP 3 ISSUES:
${analysis.syntaxErrors.slice(0, 3).map(e => `- Line ${e.line}: ${e.message}`).join('\n')}
${analysis.playwrightApiIssues.slice(0, 3).map(e => `- Line ${e.line}: ${e.message}`).join('\n')}

Provide 3-5 specific, actionable recommendations for an engineer to fix these issues:`;

      const response = await this.llmClient.generateResponse(systemPrompt, userPrompt);
      
      return response.split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 5);

    } catch (error) {
      console.warn('LLM recommendation generation failed:', error);
      return [
        'Could not generate LLM recommendations',
        'Please review the detected issues manually',
        'Focus on fixing syntax errors first',
        'Then address Playwright API usage issues',
        'Finally optimize selectors and performance'
      ];
    }
  }

  /**
   * Calculate overall quality score (0-100)
   */
  private calculateQualityScore(analysis: TestAnalysisResult): number {
    let score = 100;

    // Deduct points for issues
    score -= analysis.syntaxErrors.length * 15;
    score -= analysis.playwrightApiIssues.filter(i => i.severity === 'error').length * 10;
    score -= analysis.playwrightApiIssues.filter(i => i.severity === 'warning').length * 5;
    score -= analysis.selectorQualityIssues.filter(i => i.severity === 'warning').length * 3;
    score -= analysis.performanceIssues.length * 2;
    score -= analysis.maintainabilityIssues.length * 2;

    // Add points for good practices
    score += analysis.selectorQualityIssues.filter(i => i.type === 'good_selector').length * 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate comprehensive engineer report
   */
  private async generateComprehensiveReport(
    tests: PlaywrightTest[],
    scenarios: ValidatedScenario[],
    analysisResults: TestAnalysisResult[]
  ): Promise<EngineerReviewReport> {
    const timestamp = new Date().toISOString();
    const reportPath = path.join('reports', `engineer-review-${Date.now()}.md`);

    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }

    const totalIssues = analysisResults.reduce((sum, result) => 
      sum + result.syntaxErrors.length + result.playwrightApiIssues.length + 
      result.selectorQualityIssues.length + result.performanceIssues.length + 
      result.maintainabilityIssues.length, 0);

    const averageScore = analysisResults.reduce((sum, result) => 
      sum + result.overallScore, 0) / analysisResults.length;

    const report: EngineerReviewReport = {
      timestamp,
      reportPath,
      summary: {
        totalTests: tests.length,
        totalIssues,
        averageQualityScore: Math.round(averageScore),
        testsNeedingAttention: analysisResults.filter(r => r.overallScore < 70).length,
        readyForExecution: analysisResults.filter(r => r.syntaxErrors.length === 0).length
      },
      testAnalyses: analysisResults,
      prioritizedActions: this.generatePrioritizedActions(analysisResults),
      recommendations: await this.generateOverallRecommendations(analysisResults)
    };

    return report;
  }

  /**
   * Generate prioritized action items for engineers
   */
  private generatePrioritizedActions(analysisResults: TestAnalysisResult[]): PrioritizedAction[] {
    const actions: PrioritizedAction[] = [];

    // High priority: Syntax errors
    analysisResults.forEach(result => {
      result.syntaxErrors.forEach(error => {
        actions.push({
          priority: 'high',
          type: 'syntax_error',
          filename: result.filename,
          line: error.line,
          description: error.message,
          estimatedEffort: 'low',
          impact: 'blocking'
        });
      });
    });

    // Medium priority: API issues
    analysisResults.forEach(result => {
      result.playwrightApiIssues.filter(i => i.severity === 'error').forEach(issue => {
        actions.push({
          priority: 'medium',
          type: 'api_error',
          filename: result.filename,
          line: issue.line,
          description: issue.message,
          estimatedEffort: 'medium',
          impact: 'functional'
        });
      });
    });

    // Low priority: Optimizations
    analysisResults.forEach(result => {
      result.performanceIssues.forEach(issue => {
        actions.push({
          priority: 'low',
          type: 'performance',
          filename: result.filename,
          line: issue.line,
          description: issue.message,
          estimatedEffort: 'low',
          impact: 'optimization'
        });
      });
    });

    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate overall recommendations for the test suite
   */
  private async generateOverallRecommendations(analysisResults: TestAnalysisResult[]): Promise<string[]> {
    const totalSyntaxErrors = analysisResults.reduce((sum, r) => sum + r.syntaxErrors.length, 0);
    const totalApiIssues = analysisResults.reduce((sum, r) => sum + r.playwrightApiIssues.length, 0);
    const averageScore = analysisResults.reduce((sum, r) => sum + r.overallScore, 0) / analysisResults.length;

    const recommendations: string[] = [];

    if (totalSyntaxErrors > 0) {
      recommendations.push('**CRITICAL**: Fix all syntax errors before running tests');
    }

    if (totalApiIssues > 5) {
      recommendations.push('**HIGH**: Review Playwright API usage patterns across tests');
    }

    if (averageScore < 70) {
      recommendations.push('**MEDIUM**: Overall test quality needs improvement');
    }

    recommendations.push('**BEST PRACTICE**: Run tests in headed mode first to verify functionality');
    recommendations.push('**PROCESS**: Use this report to prioritize fixes by impact and effort');
    recommendations.push('**GOAL**: Aim for quality scores above 80 for production readiness');

    return recommendations;
  }

  /**
   * Save report to markdown file
   */
  private async saveReportToFile(report: EngineerReviewReport): Promise<void> {
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(report.reportPath, markdown, 'utf-8');
  }

  /**
   * Generate markdown formatted report
   */
  private generateMarkdownReport(report: EngineerReviewReport): string {
    return `# Engineer Review Report

**Generated**: ${report.timestamp}
**Total Tests**: ${report.summary.totalTests}
**Overall Quality Score**: ${report.summary.averageQualityScore}/100

## Summary

- **Total Issues Found**: ${report.summary.totalIssues}
- **Tests Ready for Execution**: ${report.summary.readyForExecution}/${report.summary.totalTests}
- **Tests Needing Attention**: ${report.summary.testsNeedingAttention}

## Prioritized Actions

${report.prioritizedActions.map(action => 
  `### ${action.priority.toUpperCase()} - ${action.filename}:${action.line}
- **Type**: ${action.type}
- **Description**: ${action.description}
- **Estimated Effort**: ${action.estimatedEffort}
- **Impact**: ${action.impact}
`).join('\n')}

## Individual Test Analysis

${report.testAnalyses.map(analysis => `
### ${analysis.filename} (Score: ${analysis.overallScore}/100)

**Issues Found:**
- Syntax Errors: ${analysis.syntaxErrors.length}
- API Issues: ${analysis.playwrightApiIssues.length}
- Selector Issues: ${analysis.selectorQualityIssues.length}
- Performance Issues: ${analysis.performanceIssues.length}
- Maintainability Issues: ${analysis.maintainabilityIssues.length}

**Top Recommendations:**
${analysis.recommendedFixes.map(fix => `- ${fix}`).join('\n')}

${analysis.syntaxErrors.length > 0 ? `
**Syntax Errors:**
${analysis.syntaxErrors.map(error => `- Line ${error.line}: ${error.message}`).join('\n')}
` : ''}

${analysis.playwrightApiIssues.length > 0 ? `
**API Issues:**
${analysis.playwrightApiIssues.map(issue => `- Line ${issue.line}: ${issue.message} (${issue.severity})`).join('\n')}
` : ''}
`).join('\n')}

## Overall Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

1. **Fix Critical Issues**: Address all syntax errors first
2. **Review API Usage**: Fix Playwright API issues  
3. **Optimize Selectors**: Improve selector robustness
4. **Test Execution**: Run tests in headed mode to verify
5. **Iterate**: Re-run analysis after fixes

---
*This report was generated by Agent G - Comprehensive Test Analysis*
`;
  }
}

// Type definitions for the analysis system
export interface EngineerReviewReport {
  timestamp: string;
  reportPath: string;
  summary: {
    totalTests: number;
    totalIssues: number;
    averageQualityScore: number;
    testsNeedingAttention: number;
    readyForExecution: number;
  };
  testAnalyses: TestAnalysisResult[];
  prioritizedActions: PrioritizedAction[];
  recommendations: string[];
}

export interface TestAnalysisResult {
  filename: string;
  syntaxErrors: SyntaxError[];
  warningsAndBestPractices: BestPracticeIssue[];
  playwrightApiIssues: PlaywrightAPIIssue[];
  selectorQualityIssues: SelectorQualityIssue[];
  performanceIssues: PerformanceIssue[];
  maintainabilityIssues: MaintainabilityIssue[];
  overallScore: number;
  recommendedFixes: string[];
}

export interface SyntaxError {
  line: number;
  character: number;
  message: string;
  severity: 'error' | 'warning';
  code: number;
}

export interface PlaywrightAPIIssue {
  line: number;
  type: 'deprecated_api' | 'missing_await' | 'inefficient_selector' | 'missing_error_handling';
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}

export interface SelectorQualityIssue {
  line: number;
  type: 'brittle_selector' | 'class_based_selector' | 'case_sensitive_text' | 'good_selector';
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  robustnessScore: number; // 1-10 scale
  suggestion: string;
}

export interface PerformanceIssue {
  line: number;
  type: 'excessive_wait' | 'networkidle_usage' | 'multiple_navigations';
  message: string;
  severity: 'warning' | 'info';
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface MaintainabilityIssue {
  line: number;
  type: 'hardcoded_values' | 'hardcoded_assertions' | 'missing_describe_block';
  message: string;
  severity: 'warning' | 'info';
  suggestion: string;
}

export interface BestPracticeIssue {
  line: number;
  type: 'missing_imports' | 'test_only_usage' | 'no_assertions';
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}

export interface PrioritizedAction {
  priority: 'high' | 'medium' | 'low';
  type: 'syntax_error' | 'api_error' | 'performance' | 'maintainability';
  filename: string;
  line: number;
  description: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  impact: 'blocking' | 'functional' | 'optimization';
}
