#!/usr/bin/env tsx

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface SelectorResult {
  path: string;
  selector: string;
  exists: boolean;
  count: number;
  workingSelector?: string;
  error?: string;
}

/**
 * Live validation of selectors against actual Experian website
 */
async function validateSelectorsLive(): Promise<void> {
  console.log('Validating selectors against live Experian website...\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Load selectors
    const selectorsPath = path.join(__dirname, '../kb/selectors/common.json');
    const selectorsData = JSON.parse(fs.readFileSync(selectorsPath, 'utf-8'));

    // Launch browser
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: false }); // Use headed for debugging
    page = await browser.newPage();

    // Navigate to Experian
    const url = 'https://www.experian.com';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 45000 
    });
    await page.waitForTimeout(3000); // Wait for dynamic content and dropdowns

    const results: SelectorResult[] = [];

    // Validate each selector
    for (const [sectionName, sectionSelectors] of Object.entries(selectorsData)) {
      console.log(`\nSection: ${sectionName}`);
      
      for (const [elementName, selectorString] of Object.entries(sectionSelectors as Record<string, string>)) {
        const fullPath = `${sectionName}.${elementName}`;
        console.log(`  ${elementName}...`);

        const result = await validateSelector(page, fullPath, selectorString);
        results.push(result);

        // Show immediate feedback
        if (result.exists) {
          console.log(`    Found ${result.count} element(s) with: ${result.workingSelector}`);
        } else {
          console.log(`    Not found: ${result.selector}`);
        }
      }
    }

    // Generate report
    await generateReport(results, url);

    // Show summary
    showSummary(results);

  } catch (error) {
    console.error('Validation failed:', error);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

/**
 * Validate a single selector against the page
 */
async function validateSelector(page: Page, path: string, selectorString: string): Promise<SelectorResult> {
  const selectors = selectorString.split(',').map(s => s.trim());
  
  for (const selector of selectors) {
    try {
      // Clean up selector (remove Playwright-specific syntax)
      const cleanSelector = cleanPlaywrightSelector(selector);
      
      const elements = await page.locator(cleanSelector).count();
      
      if (elements > 0) {
        return {
          path,
          selector: selectorString,
          exists: true,
          count: elements,
          workingSelector: cleanSelector
        };
      }
    } catch (error) {
      // Continue to next selector
    }
  }

  return {
    path,
    selector: selectorString,
    exists: false,
    count: 0,
    error: 'No working selector found'
  };
}

/**
 * Clean up selector syntax for Playwright compatibility
 */
function cleanPlaywrightSelector(selector: string): string {
  // Convert jQuery-style :contains() to Playwright text selector
  if (selector.includes(':contains(')) {
    const match = selector.match(/:contains\(['"]([^'"]+)['"]\)/);
    if (match) {
      const text = match[1];
      const baseSelector = selector.split(':contains(')[0];
      return baseSelector ? `${baseSelector}:has-text("${text}")` : `text="${text}"`;
    }
  }

  // Convert button:contains() to Playwright syntax
  if (selector.includes('button:contains(')) {
    const match = selector.match(/button:contains\(['"]([^'"]+)['"]\)/);
    if (match) {
      const text = match[1];
      return `button:has-text("${text}")`;
    }
  }

  // Convert a:contains() to Playwright syntax
  if (selector.includes('a:contains(')) {
    const match = selector.match(/a:contains\(['"]([^'"]+)['"]\)/);
    if (match) {
      const text = match[1];
      return `a:has-text("${text}")`;
    }
  }

  return selector;
}

/**
 * Generate validation report
 */
async function generateReport(results: SelectorResult[], url: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const validResults = results.filter(r => r.exists);
  const invalidResults = results.filter(r => !r.exists);
  const successRate = Math.round((validResults.length / results.length) * 100);

  const reportContent = `# Live Selector Validation Report

**Generated**: ${timestamp}
**URL**: ${url}
**Success Rate**: ${successRate}%

## Summary

- **Total Selectors**: ${results.length}
- **Valid Selectors**: ${validResults.length}
- **Invalid Selectors**: ${invalidResults.length}

## Working Selectors (${validResults.length})

${validResults.map(r => 
  `### ${r.path}
- **Original**: \`${r.selector}\`
- **Working**: \`${r.workingSelector}\`
- **Count**: ${r.count} elements found

`).join('')}

## Broken Selectors (${invalidResults.length})

${invalidResults.map(r => 
  `### ${r.path}
- **Selector**: \`${r.selector}\`
- **Issue**: ${r.error || 'Element not found'}

`).join('')}

## Recommended Actions

${invalidResults.length > 0 ? `
### High Priority Fixes
${invalidResults.slice(0, 5).map(r => 
  `- **${r.path}**: Update selector - element not found on page`
).join('\n')}

### Steps to Fix
1. **Inspect the live website** for the actual selectors
2. **Use browser dev tools** to find working selectors
3. **Update common.json** with new selectors
4. **Re-run validation**: \`npm run validate-selectors-live\`
` : 'All selectors are working correctly!'}

## Tools Available

- \`npm run validate-selectors-live\` - Run this validation again
- \`npm run discover-locators\` - Use Skyvern AI for smart discovery
- \`npm run enhance-page-objects\` - Add fallback selectors

---
*Report generated by Live Selector Validation Tool*
`;

  // Save report
  const reportDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `live-selector-validation-${Date.now()}.md`);
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  
  console.log(`\nReport saved to: ${reportPath}`);
}

/**
 * Show validation summary
 */
function showSummary(results: SelectorResult[]): void {
  const validResults = results.filter(r => r.exists);
  const invalidResults = results.filter(r => !r.exists);
  const successRate = Math.round((validResults.length / results.length) * 100);

  console.log('\n' + '='.repeat(60));
  console.log('LIVE VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Working: ${validResults.length}/${results.length}`);
  console.log(`Broken: ${invalidResults.length}/${results.length}`);

  if (invalidResults.length > 0) {
    console.log('\nBroken Selectors:');
    invalidResults.slice(0, 5).forEach(r => {
      console.log(`   - ${r.path}`);
    });
    
    if (invalidResults.length > 5) {
      console.log(`   ... and ${invalidResults.length - 5} more`);
    }
  }

  console.log('\nNext Steps:');
  if (successRate < 70) {
    console.log('   Many selectors need updates - check the detailed report');
  } else if (successRate < 90) {
    console.log('   Some selectors need attention - update the broken ones');
  } else {
    console.log('   Selectors are in good shape!');
  }
  
  console.log('   Review the detailed markdown report for specific fixes');
}

// Run validation
if (require.main === module) {
  validateSelectorsLive().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
