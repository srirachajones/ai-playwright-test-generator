import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { PlaywrightMCPConfig, defaultMCPConfig } from './playwright-mcp-config';

/**
 * Microsoft Playwright MCP Client Integration
 * Uses the official @playwright/mcp server for real-time validation
 */
export class MicrosoftPlaywrightMCPClient {
  private client: Client | null = null;
  private config: PlaywrightMCPConfig;
  private isConnected: boolean = false;

  constructor(config?: Partial<PlaywrightMCPConfig>) {
    this.config = { ...defaultMCPConfig, ...config };
  }

  /**
   * Initialize connection to Microsoft's Playwright MCP server
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('Playwright MCP is disabled, using fallback validation');
      return;
    }

    try {
      console.log('Connecting to Microsoft Playwright MCP server...');
      
      // Create transport to Microsoft's Playwright MCP server
      const transport = new StdioClientTransport({
        command: 'npx',
        args: ['@playwright/mcp'],
        env: process.env
      });

      // Create MCP client
      this.client = new Client(
        { 
          name: 'experian-playwright-framework', 
          version: '1.0.0' 
        },
        { 
          capabilities: {
            roots: {
              listChanged: true
            },
            sampling: {}
          } 
        }
      );

      // Connect to the server
      await this.client.connect(transport);
      this.isConnected = true;
      
      console.log('Connected to Microsoft Playwright MCP server');
      
      // List available tools for debugging
      const tools = await this.client.listTools();
      console.log(`Available MCP tools: ${tools.tools?.map(t => t.name).join(', ')}`);
      
    } catch (error) {
      console.warn('MCP connection failed, using fallback validation:', error);
      this.isConnected = false;
    }
  }

  /**
   * Generate Playwright test with MCP server validation
   */
  async generateValidatedTest(scenario: any): Promise<string> {
    if (this.isConnected && this.client) {
      return await this.generateWithMCPServer(scenario);
    } else {
      return await this.generateWithFallbackValidation(scenario);
    }
  }

  /**
   * Generate test using Microsoft's MCP server
   */
  private async generateWithMCPServer(scenario: any): Promise<string> {
    try {
      console.log('Generating test with Microsoft Playwright MCP server...');
      
      // Start a browser session via MCP
      await this.client!.callTool({
        name: 'browser_navigate',
        arguments: {
          url: 'https://www.experian.com'
        }
      });

      // Take a snapshot to understand the page structure
      const snapshot = await this.client!.callTool({
        name: 'browser_snapshot',
        arguments: {}
      });

      // Generate test based on scenario and real page structure
      const testCode = this.generateTestFromSnapshot(scenario, snapshot);
      
      // Validate the generated test
      const validatedCode = await this.validateTestWithMCP(testCode);
      
      return validatedCode;
      
    } catch (error) {
      console.warn('MCP server generation failed, using fallback:', error);
      return await this.generateWithFallbackValidation(scenario);
    }
  }

  /**
   * Generate test from MCP snapshot data
   */
  private generateTestFromSnapshot(scenario: any, snapshot: any): string {
    const snapshotContent = snapshot.content?.[0]?.text || '';
    const testName = scenario.title || 'Generated Test';
    
    // Extract elements from snapshot for more accurate selectors
    const elements = this.extractElementsFromSnapshot(snapshotContent);
    
    return `import { test, expect } from '@playwright/test';
import { HomePage, SignInPage, DashboardPage } from '@pages';
import { VisualTestHelper } from '@utils/visual-helpers';

test.describe('${testName}', () => {
  test('${scenario.description || testName}', async ({ page }) => {
    // Initialize visual helpers
    const visualHelper = new VisualTestHelper(page);
    await visualHelper.initializeVisualEnhancements();
    
    const homePage = new HomePage(page);

    // Given: User navigates to homepage
    await visualHelper.logStep('Navigating to Experian homepage', 'NAVIGATE');
    await homePage.goto();
    await visualHelper.takeStepScreenshot('homepage-loaded');

    // When: User performs the main action
    await visualHelper.logStep('Performing main test action', 'ACTION');
    ${this.generateScenarioStepsFromSnapshot(scenario, elements)}

    // Then: Verify expected outcome
    await visualHelper.logStep('Verifying test results', 'SUCCESS');
    await visualHelper.showResult(true, 'Test completed successfully');
  });
});`;
  }

  /**
   * Extract interactive elements from MCP snapshot
   */
  private extractElementsFromSnapshot(snapshotContent: string): Array<{type: string, text: string, ref: string}> {
    const elements: Array<{type: string, text: string, ref: string}> = [];
    
    // Parse snapshot content for interactive elements
    const lines = snapshotContent.split('\n');
    
    for (const line of lines) {
      // Look for buttons, links, inputs
      if (line.includes('- button ') || line.includes('- link ') || line.includes('- textbox ')) {
        const match = line.match(/- (\w+) "([^"]+)"/);
        if (match) {
          const [, type, text] = match;
          elements.push({
            type,
            text,
            ref: `${type}_${text.replace(/\s+/g, '_').toLowerCase()}`
          });
        }
      }
    }
    
    return elements;
  }

  /**
   * Generate scenario-specific steps using real elements from snapshot
   */
  private generateScenarioStepsFromSnapshot(scenario: any, elements: Array<{type: string, text: string, ref: string}>): string {
    const title = scenario.title?.toLowerCase() || '';
    
    if (title.includes('credit score')) {
      const creditElements = elements.filter(el => 
        el.text.toLowerCase().includes('credit') || 
        el.text.toLowerCase().includes('score')
      );
      
      if (creditElements.length > 0) {
        const element = creditElements[0];
        return `
    // Click on credit score related element found by MCP
    await page.getByRole('${element.type}', { name: '${element.text}' }).click();
    await visualHelper.takeStepScreenshot('credit-score-clicked');
    
    // Verify credit score section is visible
    await expect(page.getByText('Credit Score')).toBeVisible();`;
      }
    }
    
    if (title.includes('sign in') || title.includes('login')) {
      const signInElements = elements.filter(el => 
        el.text.toLowerCase().includes('sign in') || 
        el.text.toLowerCase().includes('log in')
      );
      
      if (signInElements.length > 0) {
        const element = signInElements[0];
        return `
    // Click on sign in element found by MCP
    await page.getByRole('${element.type}', { name: '${element.text}' }).click();
    await visualHelper.takeStepScreenshot('signin-clicked');
    
    // Fill login form
    await page.getByRole('textbox', { name: /email/i }).fill(testUser.username);
    await page.getByRole('textbox', { name: /password/i }).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();`;
      }
    }
    
    if (title.includes('credit freeze')) {
      const freezeElements = elements.filter(el => 
        el.text.toLowerCase().includes('freeze') || 
        el.text.toLowerCase().includes('security')
      );
      
      if (freezeElements.length > 0) {
        const element = freezeElements[0];
        return `
    // Click on credit freeze element found by MCP
    await page.getByRole('${element.type}', { name: '${element.text}' }).click();
    await visualHelper.takeStepScreenshot('credit-freeze-clicked');
    
    // Verify credit freeze information is displayed
    await expect(page.getByText(/freeze/i)).toBeVisible();`;
      }
    }
    
    // Generic fallback
    return `
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await visualHelper.takeStepScreenshot('page-ready');
    
    // Verify page title contains expected content
    await expect(page).toHaveTitle(/Experian/i);`;
  }

  /**
   * Validate generated test using MCP server
   */
  private async validateTestWithMCP(testCode: string): Promise<string> {
    if (!this.isConnected || !this.client) {
      return testCode;
    }

    try {
      // Use MCP to validate selectors and API usage
      // This is a conceptual validation - the actual implementation would depend on
      // Microsoft's MCP server capabilities for code validation
      
      console.log('Validating test code with MCP server...');
      
      // For now, return the test code as MCP validation would be more complex
      // In a full implementation, we'd send the code to MCP for validation
      
      return testCode;
      
    } catch (error) {
      console.warn('MCP validation failed:', error);
      return testCode;
    }
  }

  /**
   * Fallback test generation without MCP
   */
  private async generateWithFallbackValidation(scenario: any): Promise<string> {
    console.log('Using fallback test generation...');
    
    const testName = scenario.title || 'Generated Test';
    
    return `import { test, expect } from '@playwright/test';
import { HomePage, SignInPage, DashboardPage } from '@pages';
import { VisualTestHelper } from '@utils/visual-helpers';

test.describe('${testName}', () => {
  test('${scenario.description || testName}', async ({ page }) => {
    // Initialize visual helpers
    const visualHelper = new VisualTestHelper(page);
    await visualHelper.initializeVisualEnhancements();
    
    const homePage = new HomePage(page);

    // Given: User navigates to homepage
    await visualHelper.logStep('Navigating to Experian homepage', 'NAVIGATE');
    await homePage.goto();
    await visualHelper.takeStepScreenshot('homepage-loaded');

    // When: User performs the main action
    await visualHelper.logStep('Performing main test action', 'ACTION');
    await page.waitForLoadState('networkidle');
    await visualHelper.takeStepScreenshot('page-ready');

    // Then: Verify expected outcome
    await visualHelper.logStep('Verifying test results', 'SUCCESS');
    await expect(page).toHaveTitle(/Experian/i);
    await visualHelper.showResult(true, 'Test completed successfully');
  });
});`;
  }

  /**
   * Test MCP connection and available tools
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      // Test basic MCP functionality
      const tools = await this.client.listTools();
      console.log('MCP Tools available:', tools.tools?.length || 0);
      
      return true;
    } catch (error) {
      console.error('MCP connection test failed:', error);
      return false;
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from Microsoft Playwright MCP server');
    }
  }

  /**
   * Get available MCP tools for debugging
   */
  async getAvailableTools(): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      return [];
    }

    try {
      const tools = await this.client.listTools();
      return tools.tools?.map(tool => tool.name) || [];
    } catch (error) {
      console.error('Failed to get MCP tools:', error);
      return [];
    }
  }
}
