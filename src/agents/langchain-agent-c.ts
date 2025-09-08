import { ValidatedScenario, PlaywrightTest } from '../types';
import { LangChainClient } from '../llm/langchain-client';
import { AGENT_C_TEMPLATE } from '../llm/prompt-templates';

export class LangChainAgentC {
  private llmClient: LangChainClient;

  constructor(llmClient?: LangChainClient) {
    this.llmClient = llmClient || new LangChainClient();
  }

  async generatePlaywrightTests(validatedScenarios: ValidatedScenario[]): Promise<PlaywrightTest[]> {
    console.log(`Agent C (${this.llmClient.getModelInfo().provider}): Generating tests...`);
    
    const tests = await Promise.all(
      validatedScenarios.map(scenario => this.generateSingleTest(scenario))
    );
    
    console.log(`Agent C: Generated ${tests.length} test files`);
    return tests;
  }

  private async generateSingleTest(scenario: ValidatedScenario): Promise<PlaywrightTest> {
    const filename = this.generateFilename(scenario);
    
    try {
      // Use LangChain for intelligent test generation
      const content = await this.generateLLMTestContent(scenario);
      return { filename, content };
      
    } catch (error) {
      console.warn(`LLM test generation failed for ${filename}, using fallback`);
      
      // Fallback to rule-based generation
      const content = this.generateFallbackTestContent(scenario);
      return { filename, content };
    }
  }

  private async generateLLMTestContent(scenario: ValidatedScenario): Promise<string> {
    const response = await this.llmClient.generateWithTemplate(AGENT_C_TEMPLATE, {
      validatedScenario: JSON.stringify(scenario, null, 2),
      selectors: JSON.stringify(scenario.selectors, null, 2),
      endpoints: scenario.api_endpoints.join('\n')
    });

    // Clean up the response
    return response
      .replace(/```typescript\s*/g, '')
      .replace(/```ts\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  private generateFallbackTestContent(scenario: ValidatedScenario): string {
    const imports = this.generateImports();
    const testDescription = this.generateTestDescription(scenario);
    const testBody = this.generateTestBody(scenario);
    
    return `${imports}\n\n${testDescription}\n${testBody}\n});`;
  }

  private generateFilename(scenario: ValidatedScenario): string {
    const sanitized = scenario.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const device = scenario.device ? `-${scenario.device}` : '';
    return `${sanitized}${device}.spec.ts`;
  }

  private generateImports(): string {
    return `import { test, expect, devices } from '@playwright/test';`;
  }

  private generateTestDescription(scenario: ValidatedScenario): string {
    const deviceConfig = scenario.device === 'mobile' 
      ? `.use({ ...devices['iPhone 13'] })` 
      : '';
    
    return `test.describe('${scenario.title}', () => {
  // Scenario Type: ${scenario.type}
  // Description: ${scenario.description}
  // Expected Outcome: ${scenario.expected_outcome}
  ${scenario.validation_notes.map(note => `  // ${note}`).join('\n')}

  test('${scenario.title}'${deviceConfig}, async ({ page }) => {`;
  }

  private generateTestBody(scenario: ValidatedScenario): string {
    const steps = scenario.steps.map((step, index) => 
      this.generateStepCode(step, index, scenario)
    ).join('\n\n');

    const selectorComments = Object.entries(scenario.selectors).length > 0
      ? `\n    // Available selectors:\n${Object.entries(scenario.selectors)
          .map(([name, selector]) => `    // ${name}: ${selector}`)
          .join('\n')}`
      : '';

    const apiComments = scenario.api_endpoints.length > 0
      ? `\n    // Relevant API endpoints:\n${scenario.api_endpoints
          .map(endpoint => `    // ${endpoint}`)
          .join('\n')}`
      : '';

    return `${selectorComments}${apiComments}

    ${steps}

    // Verify expected outcome
    ${this.generateOutcomeVerification(scenario)}`;
  }

  private generateStepCode(step: string, index: number, scenario: ValidatedScenario): string {
    const stepComment = `    // Given/When/Then: ${step}`;
    
    if (step.toLowerCase().includes('navigate')) {
      return `${stepComment}
    await page.goto('/'); // TODO: Replace with actual URL`;
    }
    
    if (step.toLowerCase().includes('click') || step.toLowerCase().includes('button')) {
      const selector = this.findBestSelector(step, scenario.selectors, 'button') || 
                     'button'; // fallback
      return `${stepComment}
    await page.click('${selector}');`;
    }
    
    if (step.toLowerCase().includes('fill') || step.toLowerCase().includes('enter')) {
      const selector = this.findBestSelector(step, scenario.selectors, 'input') || 
                     'input'; // fallback
      return `${stepComment}
    await page.fill('${selector}', 'test-data'); // TODO: Replace with actual test data`;
    }
    
    if (step.toLowerCase().includes('wait') || step.toLowerCase().includes('load')) {
      return `${stepComment}
    await page.waitForLoadState('networkidle');`;
    }
    
    if (step.toLowerCase().includes('verify') || step.toLowerCase().includes('check')) {
      return `${stepComment}
    // TODO: Add specific verification logic
    await expect(page).toHaveURL(/.*\\/expected-page/);`;
    }
    
    return `${stepComment}
    // TODO: Implement step logic for: ${step}`;
  }

  private findBestSelector(step: string, selectors: Record<string, string>, fallback: string): string {
    const stepLower = step.toLowerCase();
    
    for (const [name, selector] of Object.entries(selectors)) {
      if (stepLower.includes(name.toLowerCase()) || 
          name.toLowerCase().includes('login') && stepLower.includes('login') ||
          name.toLowerCase().includes('submit') && stepLower.includes('submit')) {
        return selector;
      }
    }
    
    return fallback;
  }

  private generateOutcomeVerification(scenario: ValidatedScenario): string {
    if (scenario.type === 'negative') {
      return `// Verify error handling
    await expect(page.locator('.error-message, .alert-error, [role="alert"]')).toBeVisible();`;
    }
    
    if (scenario.expected_outcome.toLowerCase().includes('success')) {
      return `// Verify successful completion
    await expect(page.locator('.success-message, .alert-success')).toBeVisible();`;
    }
    
    return `// TODO: Add specific outcome verification based on: ${scenario.expected_outcome}
    await expect(page).toHaveURL(/.*\\/success/);`;
  }
}

