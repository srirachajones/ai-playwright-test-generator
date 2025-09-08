import { Page, Locator } from '@playwright/test';

/**
 * Visual helpers for enhanced test debugging and visibility
 */

export class VisualTestHelper {
  private page: Page;
  private stepCounter: number = 0;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Initialize visual enhancements for the test
   */
  async initializeVisualEnhancements(): Promise<void> {
    // Create screenshots directory
    await this.page.addInitScript(() => {
      // Enhanced element highlighting with animations
      const style = document.createElement('style');
      style.textContent = `
        .playwright-highlight {
          outline: 3px solid #ff6b35 !important;
          background-color: rgba(255, 107, 53, 0.1) !important;
          animation: playwright-pulse 1s ease-in-out;
          position: relative;
          z-index: 10000;
        }
        
        .playwright-highlight::before {
          content: '👆 Playwright Interaction';
          position: absolute;
          top: -25px;
          left: 0;
          background: #ff6b35;
          color: white;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 12px;
          font-family: monospace;
          z-index: 10001;
        }
        
        @keyframes playwright-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);

      // Override click to add visual feedback
      const originalClick = HTMLElement.prototype.click;
      HTMLElement.prototype.click = function() {
        this.classList.add('playwright-highlight');
        setTimeout(() => {
          this.classList.remove('playwright-highlight');
        }, 3000);
        return originalClick.apply(this, arguments);
      };

      // Override input events for form fields
      const originalFocus = HTMLInputElement.prototype.focus;
      HTMLInputElement.prototype.focus = function() {
        this.style.boxShadow = '0 0 10px #ff6b35';
        this.style.border = '2px solid #ff6b35';
        setTimeout(() => {
          this.style.boxShadow = '';
          this.style.border = '';
        }, 2000);
        return originalFocus.apply(this, arguments);
      };
    });
  }

  /**
   * Log a test step with visual feedback
   */
  async logStep(description: string, emoji: string = '🔄'): Promise<void> {
    this.stepCounter++;
    const stepMessage = `${emoji} Step ${this.stepCounter}: ${description}`;
    console.log(`\n${stepMessage}`);
    
    // Add step overlay to page
    await this.page.evaluate((message) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 14px;
        z-index: 10000;
        max-width: 300px;
      `;
      overlay.textContent = message;
      document.body.appendChild(overlay);
      
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 3000);
    }, stepMessage);
  }

  /**
   * Take a screenshot with step information
   */
  async takeStepScreenshot(stepName: string): Promise<void> {
    const filename = `screenshots/step-${this.stepCounter}-${stepName.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    await this.page.screenshot({ 
      path: filename, 
      fullPage: true,
      animations: 'disabled' // Disable animations for consistent screenshots
    });
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  /**
   * Highlight a specific locator before interacting with it
   */
  async highlightAndInteract(locator: Locator, action: string): Promise<void> {
    console.log(`Highlighting element for ${action}...`);
    
    // Scroll element into view and highlight it
    await locator.scrollIntoViewIfNeeded();
    
    // Add temporary highlight
    await locator.evaluate((element) => {
      element.style.outline = '3px dashed #ff6b35';
      element.style.backgroundColor = 'rgba(255, 107, 53, 0.2)';
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Wait a moment for visual feedback
    await this.page.waitForTimeout(1000);
    
    // Remove highlight
    await locator.evaluate((element) => {
      element.style.outline = '';
      element.style.backgroundColor = '';
    });
  }

  /**
   * Add a pause with visual countdown
   */
  async visualPause(seconds: number, reason: string): Promise<void> {
    console.log(`Pausing for ${seconds}s: ${reason}`);
    
    for (let i = seconds; i > 0; i--) {
      await this.page.evaluate((countdown) => {
        const existing = document.querySelector('.playwright-countdown');
        if (existing) existing.remove();
        
        const countdown_div = document.createElement('div');
        countdown_div.className = 'playwright-countdown';
        countdown_div.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 107, 53, 0.9);
          color: white;
          padding: 20px;
          border-radius: 10px;
          font-family: monospace;
          font-size: 24px;
          z-index: 10000;
          text-align: center;
        `;
        countdown_div.textContent = `${countdown}`;
        document.body.appendChild(countdown_div);
      }, i);
      
      await this.page.waitForTimeout(1000);
    }
    
    // Remove countdown
    await this.page.evaluate(() => {
      const existing = document.querySelector('.playwright-countdown');
      if (existing) existing.remove();
    });
  }

  /**
   * Show success/failure indicator
   */
  async showResult(success: boolean, message: string): Promise<void> {
    const emoji = success ? 'SUCCESS' : 'FAILED';
    const color = success ? '#4CAF50' : '#F44336';
    
    await this.page.evaluate(({ emoji, message, color }) => {
      const result = document.createElement('div');
      result.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${color};
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 18px;
        z-index: 10000;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      `;
      result.innerHTML = `${emoji}<br/>${message}`;
      document.body.appendChild(result);
      
      setTimeout(() => {
        if (result.parentNode) {
          result.parentNode.removeChild(result);
        }
      }, 3000);
    }, { emoji, message, color });
    
    await this.page.waitForTimeout(1500);
  }
}
