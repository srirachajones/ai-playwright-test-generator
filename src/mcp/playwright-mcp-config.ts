/**
 * Playwright MCP (Model Context Protocol) Configuration
 * Defines how to integrate with Playwright MCP for better code generation
 */

export interface PlaywrightMCPConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  features: {
    syntaxValidation: boolean;
    selectorValidation: boolean;
    apiCompletion: boolean;
    realTimeChecking: boolean;
  };
}

export const defaultMCPConfig: PlaywrightMCPConfig = {
  enabled: process.env.PLAYWRIGHT_MCP_ENABLED !== 'false', // Default to true unless explicitly disabled
  endpoint: process.env.PLAYWRIGHT_MCP_ENDPOINT || 'stdio://@playwright/mcp',
  apiKey: process.env.PLAYWRIGHT_MCP_API_KEY || 'not_required',
  features: {
    syntaxValidation: true,
    selectorValidation: true,
    apiCompletion: true,
    realTimeChecking: false // Can be resource intensive
  }
};

/**
 * Playwright API patterns and best practices for MCP validation
 */
export const playwrightPatterns = {
  validImports: [
    "import { test, expect } from '@playwright/test';",
    "import { test, expect, devices } from '@playwright/test';",
    "import { Page, Locator } from '@playwright/test';"
  ],
  
  validTestStructures: [
    "test.describe('suite name', () => { ... })",
    "test('test name', async ({ page }) => { ... })",
    "test.use({ viewport: { width: 375, height: 667 } })"
  ],
  
  validPageMethods: [
    "page.goto(url)",
    "page.click(selector)",
    "page.fill(selector, value)",
    "page.waitForLoadState('networkidle')",
    "page.locator(selector)",
    "page.getByRole(role, options)",
    "page.getByText(text)",
    "page.getByLabel(label)"
  ],
  
  validExpectations: [
    "expect(page).toHaveURL(url)",
    "expect(page.locator(selector)).toBeVisible()",
    "expect(page.locator(selector)).toHaveText(text)",
    "expect(page.locator(selector)).toContainText(text)"
  ],
  
  invalidPatterns: [
    "test.info().annotations.push()", // Outside test context
    "test.metadata()", // Non-existent method
    "page.waitFor()", // Deprecated
    "page.$()", // Puppeteer syntax
    "browser.newPage()" // Wrong context
  ],
  
  commonMistakes: [
    {
      pattern: /test\.info\(\)\.annotations\.push/g,
      fix: "// Use comments instead of test.info() outside test context",
      description: "test.info() can only be called within test functions"
    },
    {
      pattern: /page\.\$\(/g,
      fix: "page.locator(",
      description: "Use page.locator() instead of page.$()"
    },
    {
      pattern: /waitFor\(/g,
      fix: "waitForLoadState(",
      description: "waitFor() is deprecated, use specific wait methods"
    }
  ]
};

/**
 * Experian-specific selector patterns for better validation
 */
export const experianSelectors = {
  recommended: [
    "a:contains('Free credit report')",
    "button:contains('Sign In')",
    "a[href*='boost']",
    "input[type='email']",
    "button[type='submit']"
  ],
  
  discouraged: [
    "div > div > a", // Too generic
    ".class1.class2.class3", // Too specific
    "xpath=//div[@class='something']" // XPath selectors
  ],
  
  experianSpecific: {
    creditReport: "a[href*='credit-report'], a:contains('Free credit report')",
    signIn: "a[href*='sign'], button:contains('Sign In')",
    boost: "a[href*='boost'], a:contains('Experian Boost')",
    smartMoney: "a:contains('Smart Money'), a:contains('digital checking')"
  }
};

/**
 * MCP validation rules for generated Playwright tests
 */
export const mcpValidationRules = {
  structure: {
    mustHaveImport: true,
    mustHaveDescribe: true,
    mustHaveTest: true,
    mustUseAsync: true
  },
  
  syntax: {
    noTrailingText: true,
    properBraces: true,
    validSelectors: true,
    awaitRequired: ['goto', 'click', 'fill', 'waitFor']
  },
  
  experian: {
    useHttpsUrl: true,
    baseUrl: 'https://www.experian.com',
    preferDataTestId: true,
    includeErrorHandling: true
  }
};

