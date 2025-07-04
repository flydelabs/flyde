import { test, expect } from '@playwright/test';

const WEBVIEW_PORT = 5174;

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the webview with dummy data
    await page.goto(`http://localhost:${WEBVIEW_PORT}?dummy=true`);
    
    // Wait for the root element to be rendered
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Wait for everything to stabilize and theme to apply
    await page.waitForTimeout(3000);
  });

  test('HelloWorld flow - light theme', async ({ page }) => {
    // Take screenshot and compare with baseline
    await expect(page).toHaveScreenshot('helloworld-flow-light.png');
  });

  test('HelloWorld flow - dark theme', async ({ page }) => {
    // Take screenshot and compare with baseline
    await expect(page).toHaveScreenshot('helloworld-flow-dark.png');
  });
});