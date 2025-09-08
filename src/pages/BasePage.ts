import { Page, Locator } from '@playwright/test';
import { VisualTestHelper } from '../utils/visual-helpers';

export abstract class BasePage {
  readonly page: Page;
  readonly url: string;
  protected visualHelper: VisualTestHelper;

  constructor(page: Page, url: string = '') {
    this.page = page;
    this.url = url;
    this.visualHelper = new VisualTestHelper(page);
  }

  /**
   * Navigate to the page with visual feedback
   */
  async goto(): Promise<void> {
    if (this.url) {
      await this.visualHelper.initializeVisualEnhancements();
      await this.visualHelper.logStep(`Navigating to ${this.url}`, 'NAVIGATE');
      await this.page.goto(this.url);
      await this.waitForPageLoad();
      await this.visualHelper.takeStepScreenshot('page-loaded');
    }
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Add a small delay for dynamic content
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator, timeout: number = 10000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for URL to contain specific text
   */
  async waitForUrl(urlPart: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForURL(`**/*${urlPart}*`, { timeout });
  }
}
