import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    headless: false,
    trace: 'on-first-retry',
    slowMo: 1500, // Slow down actions by 1.5 seconds for better visibility
    screenshot: 'on', // Take screenshots on every action
    video: 'on', // Record video for all tests
    // Enable locator highlighting
    launchOptions: {
      slowMo: 1500,
      // Additional browser options for better visibility
      args: ['--disable-web-security', '--allow-running-insecure-content']
    }
  },
  reporter: [['list']],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ]
});
