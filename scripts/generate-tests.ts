#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { LangChainAgentA } from '../src/agents/langchain-agent-a';
import { LangChainAgentB } from '../src/agents/langchain-agent-b';
import { LangChainAgentC } from '../src/agents/langchain-agent-c';
import { MCPEnhancedAgentC } from '../src/agents/mcp-enhanced-agent-c';
import { LangChainClient } from '../src/llm/langchain-client';
import { AnalysisAgentG, EngineerReviewReport } from '../src/agents/analysis-agent-g';
import { UserStory } from '../src/types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class TestGenerator {
  private agentA: LangChainAgentA;
  private agentB: LangChainAgentB;
  private agentC: LangChainAgentC | MCPEnhancedAgentC;
  private agentG: AnalysisAgentG;
  private llmClient: LangChainClient;
  private outputDir: string;

  constructor() {
    // Initialize shared LLM client
    this.llmClient = new LangChainClient();
    
    // Initialize agents with shared client
    this.agentA = new LangChainAgentA(this.llmClient);
    this.agentB = new LangChainAgentB(this.llmClient);
    
    // Use MCP-enhanced Agent C for better Playwright syntax
    const useMCP = process.env.USE_MCP_AGENT === 'true' || true; // Default to true for better syntax
    this.agentC = useMCP 
      ? new MCPEnhancedAgentC(this.llmClient)
      : new LangChainAgentC(this.llmClient);
    
    // Initialize analysis agent for final report generation
    this.agentG = new AnalysisAgentG(this.llmClient);
    
    this.outputDir = path.join(__dirname, '../tests/generated');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateTests(userStoryDescription: string): Promise<void> {
    const modelInfo = this.llmClient.getModelInfo();
    console.log(`Starting LangChain AI-powered test generation pipeline...`);
    console.log(`Using: ${modelInfo.provider} (${modelInfo.model})\n`);
    
    const userStory: UserStory = {
      description: userStoryDescription
    };

    try {
      // Agent A: Expand user story into scenarios using LangChain
      console.log('Agent A: Expanding user story with LLM intelligence...');
      const scenarios = await this.agentA.expandUserStory(userStory);
      console.log(`Generated ${scenarios.length} intelligent test scenarios\n`);

      // Agent B: Validate scenarios against knowledge base using LangChain
      console.log('Agent B: AI-powered scenario validation with RAG...');
      const validatedScenarios = await this.agentB.validateScenarios(scenarios);
      console.log('Scenarios validated with intelligent selector/API matching\n');

      // Agent C: Generate Playwright tests using LangChain
      console.log('Agent C: AI-generated Playwright TypeScript tests...');
      const playwrightTests = await this.agentC.generatePlaywrightTests(validatedScenarios);
    
    // Write test files
    const writtenFiles: string[] = [];
    for (const test of playwrightTests) {
      const filePath = path.join(this.outputDir, test.filename);
      fs.writeFileSync(filePath, test.content, 'utf-8');
      writtenFiles.push(test.filename);
      console.log(`Created: ${test.filename}`);
    }

    // Agent G: Comprehensive test analysis and engineer report
    console.log('Agent G: Analyzing tests and generating engineer review report...');
    const engineerReport = await this.agentG.analyzeTestsAndGenerateReport(playwrightTests, validatedScenarios);
    
    // Generate summary report with analysis results
    this.generateSummaryReport(userStory, validatedScenarios, writtenFiles, modelInfo, engineerReport);
      
      console.log(`\nLangChain test generation complete! Generated ${playwrightTests.length} AI-powered test files.`);
      console.log(`Files saved to: ${this.outputDir}`);
      
      if (engineerReport) {
        console.log(`\nEngineer Review Report:`);
        console.log(`   Report: ${engineerReport.reportPath}`);
        console.log(`   Quality Score: ${engineerReport.summary.averageQualityScore}/100`);
        console.log(`   Ready to Run: ${engineerReport.summary.readyForExecution}/${engineerReport.summary.totalTests} tests`);
        console.log(`   Need Attention: ${engineerReport.summary.testsNeedingAttention} tests`);
        console.log(`   Priority Actions: ${engineerReport.prioritizedActions.length}`);
        
        if (engineerReport.summary.totalIssues > 0) {
          console.log(`\nIMPORTANT: Review the engineer report before running tests!`);
        }
      }
      
      console.log(`\nRun tests with: npm run test`);
      console.log(`View generation report: tests/generated/generation-report.json`);
      
    } catch (error) {
      console.error('LangChain test generation failed:', error);
      throw error;
    } finally {
      // Cleanup resources if needed
      console.log('Cleanup complete');
    }
  }

  private generateSummaryReport(
    userStory: UserStory, 
    scenarios: any[], 
    files: string[],
    modelInfo: { provider: string; model: string },
    engineerReport?: EngineerReviewReport
  ): void {
    const report = {
      user_story: userStory.description,
      generated_at: new Date().toISOString(),
      llm_provider: modelInfo.provider,
      llm_model: modelInfo.model,
      scenarios_count: scenarios.length,
      files_generated: files,
      pipeline_summary: {
        agent_a: `Used ${modelInfo.provider} LLM to intelligently expand user story into diverse scenarios`,
        agent_b: `AI-powered validation against RAG knowledge base with smart selector/API matching`,
        agent_c: `Microsoft MCP-enhanced Playwright TypeScript tests with real-time validation`,
        agent_g: `Comprehensive test analysis and engineer review report generation`
      },
      langchain_features: {
        prompt_templates: "Structured prompt templates for consistent AI responses",
        retry_logic: "Automatic retry with exponential backoff for reliability", 
        fallback_system: "Rule-based fallback when LLM calls fail",
        multi_provider: "Support for OpenAI, Anthropic, and Ollama"
      },
      validation_pipeline: {
        syntax_validation: "TypeScript AST parsing and Playwright API validation",
        pre_flight_checks: "Comprehensive validation before file writing",
        iterative_improvement: "AI-powered feedback loop for test refinement",
        microsoft_mcp: "Real-time Playwright API validation via Microsoft MCP server",
        pass_rate: engineerReport ? `${engineerReport.summary.readyForExecution}/${engineerReport.summary.totalTests} tests ready` : "N/A"
      },
      engineer_review: engineerReport ? {
        report_path: engineerReport.reportPath,
        total_issues: engineerReport.summary.totalIssues,
        average_quality_score: engineerReport.summary.averageQualityScore,
        tests_needing_attention: engineerReport.summary.testsNeedingAttention,
        ready_for_execution: engineerReport.summary.readyForExecution,
        priority_actions: engineerReport.prioritizedActions.length,
        recommendations: engineerReport.recommendations
      } : null,
      scenarios_summary: scenarios.map(s => ({
        title: s.title,
        type: s.type,
        device: s.device,
        selectors_found: Object.keys(s.selectors || {}).length,
        endpoints_found: (s.api_endpoints || []).length,
        validation_notes: s.validation_notes || []
      }))
    };

    const reportPath = path.join(this.outputDir, 'generation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Summary report: generation-report.json`);
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Error: Please provide a user story description');
    console.log('\nUsage: npm run generate-tests "User story description"');
    console.log('\nExamples:');
    console.log('  npm run generate-tests "User signs up and requests credit report"');
    console.log('  npm run generate-tests "User logs in to their account"');
    console.log('  npm run generate-tests "User updates their profile information"');
    console.log('  npm run generate-tests "User requests and downloads credit report"');
    console.log('\nLangChain AI Features:');
    console.log('  • OpenAI/Anthropic/Ollama LLM support');
    console.log('  • Intelligent scenario generation');
    console.log('  • Smart selector/API matching');
    console.log('  • Context-aware test code generation');
    console.log('  • Automatic retry and fallback logic');
    console.log('\nConfiguration:');
    console.log('  Set LLM_PROVIDER=openai|anthropic|ollama in .env file');
    console.log('  Add your API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY)');
    process.exit(1);
  }

  // Check for required environment variables
  const provider = process.env.LLM_PROVIDER || 'openai';
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    console.log('Create a .env file with: OPENAI_API_KEY=your_key_here');
    process.exit(1);
  }
  
  if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    console.log('Create a .env file with: ANTHROPIC_API_KEY=your_key_here');
    process.exit(1);
  }

  const userStoryDescription = args.join(' ');
  const generator = new TestGenerator();
  
  try {
    await generator.generateTests(userStoryDescription);
  } catch (error) {
    console.error('Error during LangChain test generation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
