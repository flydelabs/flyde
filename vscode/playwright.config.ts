import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  expect: {
    // Visual comparisons threshold - allow small differences due to font rendering
    threshold: 0.2,
    toHaveScreenshot: {
      // Animation handling
      animations: 'disabled',
      // Clip screenshots to remove dynamic elements
      clip: { x: 0, y: 0, width: 1200, height: 800 },
      // Platform-specific baseline management
      mode: 'os',
      // Add slight threshold for cross-platform compatibility
      threshold: 0.2,
    },
  },
  projects: [
    {
      name: 'chromium-light',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 },
        colorScheme: 'light',
      },
    },
    {
      name: 'chromium-dark',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 },
        colorScheme: 'dark',
      },
    },
  ],
  webServer: {
    command: 'vite --port 5174',
    port: 5174,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});