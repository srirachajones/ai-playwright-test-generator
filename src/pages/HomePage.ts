import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  // Header navigation locators
  readonly signInLink: Locator;
  readonly signUpLink: Locator;
  readonly logo: Locator;
  readonly navigationMenu: Locator;

  // Main content locators
  readonly heroSection: Locator;
  readonly creditReportSection: Locator;
  readonly creditScoreSection: Locator;
  readonly identityProtectionSection: Locator;
  readonly smartMoneySection: Locator;

  // Call-to-action buttons
  readonly getCreditReportButton: Locator;
  readonly viewCreditScoreButton: Locator;
  readonly startFreeTrialButton: Locator;

  constructor(page: Page) {
    super(page, 'https://www.experian.com');
    
    // Header navigation
    this.signInLink = page.locator('a[href*="login"], a[href*="signin"], text="Sign In", text="Log In"');; // Enhanced: Main sign-in navigation link (confidence: 90%)
    this.signUpLink = page.locator('a[href*="signup"], a[href*="register"], text="Sign Up", text="Register"');; // Enhanced: Main sign-up navigation link (confidence: 90%)
    this.logo = page.locator('img[alt*="logo"], img[alt*="Experian"], .logo, [data-testid="logo"]').first(); // Enhanced: Company logo image (confidence: 80%)
    this.navigationMenu = page.locator('nav, .navigation, .main-nav, [role="navigation"]');; // Enhanced: Main navigation menu (confidence: 70%)

    // Main content sections
    this.heroSection = page.locator('.hero, .banner, .main-banner, [data-testid="hero"]');; // Enhanced: Main hero/banner section (confidence: 70%)
    this.creditReportSection = page.locator('[data-testid="credit-report"], .credit-report-section');
    this.creditScoreSection = page.locator('.credit-score-section, [data-testid="credit-score-section"], .score-section');; // Enhanced: Credit score display section (confidence: 80%)
    this.identityProtectionSection = page.locator('[data-testid="identity-protection"], .identity-section');
    this.smartMoneySection = page.locator('[data-testid="smart-money"], .smart-money-section');

    // Call-to-action buttons
    this.getCreditReportButton = page.locator('button:has-text("Get Credit Report"), a:has-text("Get Credit Report"), button:has-text("Credit Report")'); // Enhanced: Get credit report call-to-action (confidence: 80%), a:has-text("Get Credit Report"), [data-testid="get-credit-report"]');
    this.viewCreditScoreButton = page.locator('button:has-text("View Credit Score"), a:has-text("View Credit Score"), button:has-text("Credit Score")'); // Enhanced: View credit score call-to-action (confidence: 80%), a:has-text("View Credit Score"), [data-testid="view-credit-score"]');
    this.startFreeTrialButton = page.locator('button:has-text("Start Free Trial"), a:has-text("Start Free Trial"), [data-testid="start-free-trial"]');
  }

  /**
   * Navigate to sign-in page with visual feedback
   */
  async navigateToSignIn(): Promise<void> {
    await this.visualHelper.logStep('Clicking sign-in link', '🔗');
    await this.visualHelper.highlightAndInteract(this.signInLink, 'click');
    await this.signInLink.click();
    await this.visualHelper.logStep('Waiting for sign-in page to load', '⏳');
    await this.waitForUrl('login');
    await this.visualHelper.takeStepScreenshot('signin-page-loaded');
  }

  /**
   * Navigate to sign-up page
   */
  async navigateToSignUp(): Promise<void> {
    await this.signUpLink.click();
    await this.waitForUrl('signup');
  }

  /**
   * Click on Get Credit Report CTA
   */
  async clickGetCreditReport(): Promise<void> {
    await this.scrollToElement(this.getCreditReportButton);
    await this.getCreditReportButton.click();
  }

  /**
   * Click on View Credit Score CTA
   */
  async clickViewCreditScore(): Promise<void> {
    await this.scrollToElement(this.viewCreditScoreButton);
    await this.viewCreditScoreButton.click();
  }

  /**
   * Check if user is signed in (by looking for sign-out link or user menu)
   */
  async isUserSignedIn(): Promise<boolean> {
    const signOutLink = this.page.locator('a:has-text("Sign Out"), a:has-text("Logout"), [data-testid="sign-out"]');
    const userMenu = this.page.locator('.user-menu, [data-testid="user-menu"], .account-menu');
    
    return (await this.isElementVisible(signOutLink)) || (await this.isElementVisible(userMenu));
  }

  /**
   * Verify homepage elements are loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await this.waitForElement(this.logo);
    await this.waitForElement(this.heroSection);
    await this.waitForElement(this.navigationMenu);
  }
}
