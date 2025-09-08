import { test, expect } from '@playwright/test';

test.describe('Invalid URL Error Handling', () => {
  test('should display an error page for incorrect Free Credit Report URL', async ({ page }) => {
    // User opens web browser - this is implied by the start of a new test
    
    // User enters 'www.experian.com/free-credit-report' in the address bar, intentionally misspelling 'report' as 'reprot'
    await page.goto('https://www.experian.com/free-credit-reprot');
    
    // User presses Enter - implied by the goto command
    
    // User waits for the navigation attempt to resolve - Playwright does this by default with page.goto
    
    // TODO: Customize the selector to identify the unique error message or page content for a non-existent page
    // This assertion checks for a generic error message or element that would be present on an error page
    // Replace '.error-message' with the actual selector on your error page
    await expect(page.locator('.error-message')).toBeVisible();
    
    // TODO: Add more assertions as necessary to validate the error page content, such as checking for a search box or links to the correct page
    // Example:
    // await expect(page.locator('text=The page you are looking for does not exist')).toBeVisible();
    // await expect(page.locator('input[type="search"]')).toBeVisible();
  });
});