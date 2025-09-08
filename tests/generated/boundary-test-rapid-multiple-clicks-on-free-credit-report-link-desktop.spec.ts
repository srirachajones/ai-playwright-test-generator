import { test, expect } from '@playwright/test';

test.describe('Boundary Test: Rapid Multiple Clicks on Free Credit Report Link', () => {
  test('System handles rapid clicks gracefully', async ({ page }) => {
    // Navigate to Experian homepage
    await page.goto('https://www.experian.com');

    // Click on Credit dropdown
    await page.click('button.m-n-link.btn-reset.dropdown-toggle[aria-label="Credit"]');

    // Rapidly click on Free Credit Report link multiple times in quick succession
    for (let i = 0; i < 5; i++) {
      // Using Promise.all to initiate clicks without waiting for navigation
      await Promise.all([
        page.click('a[href*="credit-report"]'),
        // TODO: Customize navigation timeout or handling based on observed behavior
        page.waitForLoadState('networkidle'),
      ]).catch(e => {
        console.error('Error handling rapid clicks or navigation:', e);
      });
    }

    // Assertion to verify that the Free Credit Report information page is visible
    // This is a placeholder assertion; the actual content or URL verification should be customized based on the page behavior
    await expect(page).toHaveURL(/credit-report/);

    // TODO: Add more specific assertions to verify the page content or behavior after rapid clicks
  });
});