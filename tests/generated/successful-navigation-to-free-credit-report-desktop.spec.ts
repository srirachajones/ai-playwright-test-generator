import { test, expect } from '@playwright/test';

test.describe('Successful Navigation to Free Credit Report', () => {
  test('User navigates and views the Free Credit Report page successfully', async ({ page }) => {
    // User opens web browser - handled by Playwright

    // User enters 'www.experian.com' in the address bar
    await page.goto('https://www.experian.com');

    // User waits for the Experian homepage to load
    await expect(page).toHaveURL('https://www.experian.com');
    await expect(page).toHaveTitle(/Experian/);

    // User locates and clicks on Credit dropdown
    await page.click('button.m-n-link.btn-reset.dropdown-toggle[aria-label="Credit"]');

    // User clicks on Free Credit Report link in the dropdown
    await page.click('a[href*="credit-report"]');

    // User waits for the Free Credit Report page to load
    await expect(page).toHaveURL(/credit-report/);
    await expect(page.locator('h1')).toContainText(/Free Credit Report/); // Assuming 'h1' contains the page title

    // TODO: Customize the test to include more specific checks on the Free Credit Report page
    // Example: Verify if a specific section of the report is visible
    // await expect(page.locator('selector_for_section')).toBeVisible();

    // Error handling is implicitly covered by Playwright's assertions
    // Any failure in navigation or element interaction will throw an error and fail the test
  });
});