import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  // Header elements
  readonly userMenu: Locator;
  readonly signOutLink: Locator;
  readonly accountSettings: Locator;
  readonly notifications: Locator;

  // Main dashboard sections
  readonly creditScoreSection: Locator;
  readonly creditReportSection: Locator;
  readonly identityMonitoring: Locator;
  readonly smartMoneySection: Locator;
  readonly alertsSection: Locator;

  // Credit score elements
  readonly creditScoreValue: Locator;
  readonly creditScoreRange: Locator;
  readonly scoreChangeIndicator: Locator;
  readonly viewFullReportButton: Locator;

  // Quick actions
  readonly refreshCreditButton: Locator;
  readonly disputeButton: Locator;
  readonly freezeCreditButton: Locator;
  readonly monitoringToggle: Locator;

  // Navigation sidebar (if exists)
  readonly sidebarMenu: Locator;
  readonly creditReportMenuItem: Locator;
  readonly identityProtectionMenuItem: Locator;
  readonly smartMoneyMenuItem: Locator;
  readonly accountMenuItem: Locator;

  constructor(page: Page) {
    super(page, 'https://www.experian.com/dashboard');
    
    // Header elements
    this.userMenu = page.locator('.user-menu, .account-menu, [data-testid="user-menu"], .profile-dropdown');; // Enhanced: User account menu dropdown (confidence: 80%)
    this.signOutLink = page.locator('a:has-text("Sign Out"), a:has-text("Logout"), button:has-text("Sign Out")'); // Enhanced: Sign out/logout link (confidence: 90%), a:has-text("Logout"), [data-testid="sign-out"]');
    this.accountSettings = page.locator('a:has-text("Account Settings"), a:has-text("Settings"), [data-testid="account-settings"]');
    this.notifications = page.locator('.notifications, [data-testid="notifications"], .alerts-bell');

    // Main dashboard sections
    this.creditScoreSection = page.locator('.credit-score-section, [data-testid="credit-score-section"], .score-section');; // Enhanced: Credit score display section (confidence: 80%)
    this.creditReportSection = page.locator('.credit-report-section, [data-testid="credit-report-section"]');
    this.identityMonitoring = page.locator('.identity-monitoring, [data-testid="identity-monitoring"]');
    this.smartMoneySection = page.locator('.smart-money-section, [data-testid="smart-money"]');
    this.alertsSection = page.locator('.alerts-section, [data-testid="alerts"]');

    // Credit score specific elements
    this.creditScoreValue = page.locator('.credit-score-value, .score-number, [data-testid="credit-score-value"], .score');; // Enhanced: Actual credit score number (confidence: 80%)
    this.creditScoreRange = page.locator('.score-range, [data-testid="score-range"]');
    this.scoreChangeIndicator = page.locator('.score-change, [data-testid="score-change"]');
    this.viewFullReportButton = page.locator('button:has-text("View Full Report"), a:has-text("View Full Report"), button:has-text("Full Report")'); // Enhanced: View full credit report button (confidence: 80%), [data-testid="view-full-report"]');

    // Quick actions
    this.refreshCreditButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"], [data-testid="refresh-credit"]'); // Enhanced: Refresh credit information button (confidence: 70%), [data-testid="refresh-credit"]');
    this.disputeButton = page.locator('button:has-text("Dispute"), a:has-text("Dispute"), [data-testid="dispute"]');
    this.freezeCreditButton = page.locator('button:has-text("Freeze"), a:has-text("Freeze"), [data-testid="freeze-credit"]');
    this.monitoringToggle = page.locator('input[type="checkbox"][name*="monitoring"], [data-testid="monitoring-toggle"]');

    // Sidebar navigation
    this.sidebarMenu = page.locator('.sidebar, .nav-sidebar, [data-testid="sidebar"]');
    this.creditReportMenuItem = page.locator('a:has-text("Credit Report"), [data-testid="credit-report-nav"]');
    this.identityProtectionMenuItem = page.locator('a:has-text("Identity Protection"), [data-testid="identity-protection-nav"]');
    this.smartMoneyMenuItem = page.locator('a:has-text("Smart Money"), [data-testid="smart-money-nav"]');
    this.accountMenuItem = page.locator('a:has-text("Account"), [data-testid="account-nav"]');
  }

  /**
   * Wait for dashboard to load completely
   */
  async waitForDashboardLoad(): Promise<void> {
    await this.waitForElement(this.creditScoreSection);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get credit score value
   */
  async getCreditScore(): Promise<string> {
    await this.waitForElement(this.creditScoreValue);
    return await this.creditScoreValue.textContent() || '';
  }

  /**
   * Check if credit score is displayed
   */
  async isCreditScoreVisible(): Promise<boolean> {
    return await this.isElementVisible(this.creditScoreValue);
  }

  /**
   * Click view full credit report
   */
  async viewFullCreditReport(): Promise<void> {
    await this.scrollToElement(this.viewFullReportButton);
    await this.viewFullReportButton.click();
  }

  /**
   * Navigate to credit report section
   */
  async navigateToCreditReport(): Promise<void> {
    if (await this.isElementVisible(this.creditReportMenuItem)) {
      await this.creditReportMenuItem.click();
    } else {
      await this.creditReportSection.click();
    }
  }

  /**
   * Navigate to identity protection
   */
  async navigateToIdentityProtection(): Promise<void> {
    if (await this.isElementVisible(this.identityProtectionMenuItem)) {
      await this.identityProtectionMenuItem.click();
    } else {
      await this.identityMonitoring.click();
    }
  }

  /**
   * Sign out from dashboard
   */
  async signOut(): Promise<void> {
    // Try to click user menu first if it exists
    if (await this.isElementVisible(this.userMenu)) {
      await this.userMenu.click();
    }
    
    await this.waitForElement(this.signOutLink);
    await this.signOutLink.click();
    
    // Wait for redirect to home or login page
    await this.page.waitForURL('**/login**', { timeout: 10000 }).catch(() => {
      // If no redirect to login, wait for home page
      return this.page.waitForURL('**/', { timeout: 5000 });
    });
  }

  /**
   * Check if user is successfully logged in (dashboard elements visible)
   */
  async isLoggedIn(): Promise<boolean> {
    return (await this.isElementVisible(this.creditScoreSection)) ||
           (await this.isElementVisible(this.userMenu));
  }

  /**
   * Refresh credit information
   */
  async refreshCreditInfo(): Promise<void> {
    if (await this.isElementVisible(this.refreshCreditButton)) {
      await this.refreshCreditButton.click();
      // Wait for refresh to complete
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Toggle identity monitoring
   */
  async toggleIdentityMonitoring(): Promise<void> {
    if (await this.isElementVisible(this.monitoringToggle)) {
      await this.monitoringToggle.click();
    }
  }

  /**
   * Verify dashboard page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await this.waitForElement(this.creditScoreSection);
    await this.waitForElement(this.userMenu);
  }
}
