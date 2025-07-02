#!/usr/bin/env node

/**
 * Visual Regression Test Script for Flyde VS Code Extension
 * 
 * Tests both light and dark themes of the flow editor webview.
 * 
 * Usage:
 *   npm run test:visual                 # Run tests against baseline
 *   npm run test:visual -- --update-baseline   # Update baseline images
 *   npm run test:visual -- -u          # Short form for updating baseline
 * 
 * Baseline images are stored in test-screenshots/baseline/
 * Diff images are saved to test-screenshots/diff/ when differences are found
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEBVIEW_PORT = 5174; // Vite dev server port
const FIXTURE_FILE = 'HelloWorld.flyde';

// Parse command line arguments
const args = process.argv.slice(2);
const UPDATE_BASELINE = args.includes('--update-baseline') || args.includes('-u');
const THEMES = ['light', 'dark'];

// Helper to wait for server to be ready
function waitForServer(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function check() {
      import('http').then(({ default: http }) => {
        const req = http.request({
          host: 'localhost',
          port: port,
          path: '/',
          method: 'GET'
        }, (res) => {
          resolve();
        });
        
        req.on('error', () => {
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Server not ready after ${timeout}ms`));
          } else {
            setTimeout(check, 100);
          }
        });
        
        req.end();
      });
    }
    
    check();
  });
}

async function startViteServer() {
  const viteProcess = spawn('npx', ['vite', '--port', WEBVIEW_PORT.toString()], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe'
  });

  // Wait for server to be ready
  await waitForServer(WEBVIEW_PORT);
  
  return viteProcess;
}

async function takeScreenshot(theme = 'light') {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Set theme preference for dark mode
    if (theme === 'dark') {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' }
      ]);
    }
    
    // Navigate to the webview with dummy data to load the fixture
    const url = `http://localhost:${WEBVIEW_PORT}?dummy=true&theme=${theme}`;
    console.log(`📍 Navigating to: ${url} (${theme} mode)`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Wait for the root element to be rendered
    try {
      await page.waitForSelector('#root', { timeout: 10000 });
      console.log(`✅ Root element found (${theme} mode)`);
    } catch (e) {
      console.log(`❌ Root element not found (${theme} mode)`);
      throw e;
    }
    
    // Wait a bit more for everything to stabilize and theme to apply
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    const screenshot = await page.screenshot({ 
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    return screenshot;
    
  } finally {
    await browser.close();
  }
}

async function compareScreenshots(currentBuffer, baselinePath, theme) {
  const currentPng = PNG.sync.read(currentBuffer);
  
  // If we're updating baseline or it doesn't exist, create/update it
  if (UPDATE_BASELINE || !fs.existsSync(baselinePath)) {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, currentBuffer);
    if (UPDATE_BASELINE) {
      console.log(`✅ Updated baseline screenshot (${theme}): ${baselinePath}`);
      return { isBaselineUpdate: true };
    } else {
      console.log(`✅ Created baseline screenshot (${theme}): ${baselinePath}`);
      return { isFirstRun: true };
    }
  }
  
  // Compare with baseline
  const baselineBuffer = fs.readFileSync(baselinePath);
  const baselinePng = PNG.sync.read(baselineBuffer);
  
  const { width, height } = currentPng;
  
  // Ensure dimensions match
  if (baselinePng.width !== width || baselinePng.height !== height) {
    console.log(`⚠️  Dimension mismatch (${theme}): baseline ${baselinePng.width}x${baselinePng.height}, current ${width}x${height}`);
    return { 
      hasDifferences: true, 
      diffPixels: -1,
      error: 'Dimension mismatch'
    };
  }
  
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(
    baselinePng.data,
    currentPng.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );
  
  const hasDifferences = diffPixels > 0;
  
  if (hasDifferences) {
    // Save diff and current images for debugging
    const diffDir = path.resolve(__dirname, '../test-screenshots/diff');
    fs.mkdirSync(diffDir, { recursive: true });
    
    const diffPath = path.join(diffDir, `helloworld-${theme}-diff.png`);
    const currentPath = path.join(diffDir, `helloworld-${theme}-current.png`);
    
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    fs.writeFileSync(currentPath, currentBuffer);
    
    console.log(`❌ Visual differences detected (${theme}): ${diffPixels} pixels differ`);
    console.log(`   Diff saved to: ${diffPath}`);
    console.log(`   Current saved to: ${currentPath}`);
  } else {
    console.log(`✅ No visual differences detected (${theme})`);
  }
  
  return { hasDifferences, diffPixels };
}

async function main() {
  console.log('🚀 Starting visual regression test...');
  
  if (UPDATE_BASELINE) {
    console.log('📝 Updating baseline mode enabled');
  }
  
  let viteServer;
  let hasFailures = false;
  
  try {
    // Start Vite dev server
    console.log('📦 Starting Vite dev server...');
    viteServer = await startViteServer();
    console.log(`✅ Vite server started on port ${WEBVIEW_PORT}`);
    
    // Test both themes
    for (const theme of THEMES) {
      console.log(`\n🎨 Testing ${theme} theme...`);
      
      // Take screenshot
      console.log(`📸 Taking screenshot (${theme})...`);
      const screenshot = await takeScreenshot(theme);
      console.log(`✅ Screenshot captured (${theme})`);
      
      // Compare with baseline
      const baselinePath = path.resolve(__dirname, `../test-screenshots/baseline/helloworld-flow-${theme}.png`);
      const result = await compareScreenshots(screenshot, baselinePath, theme);
      
      if (result.hasDifferences) {
        hasFailures = true;
      }
    }
    
    if (UPDATE_BASELINE) {
      console.log('\n✅ All baselines updated successfully');
      process.exit(0);
    } else if (hasFailures) {
      console.log('\n❌ Visual regression test failed - differences detected');
      process.exit(1);
    } else {
      console.log('\n✅ All visual regression tests passed');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Visual regression test failed:', error.message);
    process.exit(1);
  } finally {
    if (viteServer) {
      viteServer.kill();
    }
  }
}

main();