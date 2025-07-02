#!/usr/bin/env node

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

async function takeScreenshot() {
  const browser = await puppeteer.launch({ 
    headless: true, // Back to headless
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navigate to the webview with dummy data to load the fixture
    const url = `http://localhost:${WEBVIEW_PORT}?dummy=true`;
    console.log(`📍 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Debug: Take a full page screenshot first
    await page.screenshot({ path: '/tmp/debug-full-page.png' });
    console.log('🔍 Full page screenshot saved to /tmp/debug-full-page.png');
    
    // Check what elements exist
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    console.log('📝 Page content length:', bodyContent.length);
    
    // Check for any error messages
    const errorElement = await page.$('.error');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error found on page:', errorText);
    }
    
    // Wait for the root element to be rendered
    try {
      await page.waitForSelector('#root', { timeout: 10000 });
      console.log('✅ Root element found');
    } catch (e) {
      console.log('❌ Root element not found');
      throw e;
    }
    
    // Wait a bit more for everything to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of the whole page for now (we'll refine this later)
    const screenshot = await page.screenshot({ 
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    return screenshot;
    
  } finally {
    await browser.close();
  }
}

async function compareScreenshots(currentBuffer, baselinePath) {
  const currentPng = PNG.sync.read(currentBuffer);
  
  // If baseline doesn't exist, create it
  if (!fs.existsSync(baselinePath)) {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, currentBuffer);
    console.log(`✅ Created baseline screenshot: ${baselinePath}`);
    return { isFirstRun: true };
  }
  
  // Compare with baseline
  const baselineBuffer = fs.readFileSync(baselinePath);
  const baselinePng = PNG.sync.read(baselineBuffer);
  
  const { width, height } = currentPng;
  
  // Ensure dimensions match
  if (baselinePng.width !== width || baselinePng.height !== height) {
    console.log(`⚠️  Dimension mismatch: baseline ${baselinePng.width}x${baselinePng.height}, current ${width}x${height}`);
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
    
    const diffPath = path.join(diffDir, 'helloworld-diff.png');
    const currentPath = path.join(diffDir, 'helloworld-current.png');
    
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    fs.writeFileSync(currentPath, currentBuffer);
    
    console.log(`❌ Visual differences detected: ${diffPixels} pixels differ`);
    console.log(`   Diff saved to: ${diffPath}`);
    console.log(`   Current saved to: ${currentPath}`);
  } else {
    console.log(`✅ No visual differences detected`);
  }
  
  return { hasDifferences, diffPixels };
}

async function main() {
  console.log('🚀 Starting visual regression test...');
  
  let viteServer;
  try {
    // Start Vite dev server
    console.log('📦 Starting Vite dev server...');
    viteServer = await startViteServer();
    console.log(`✅ Vite server started on port ${WEBVIEW_PORT}`);
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    const screenshot = await takeScreenshot();
    console.log('✅ Screenshot captured');
    
    // Compare with baseline
    const baselinePath = path.resolve(__dirname, '../test-screenshots/baseline/helloworld-flow.png');
    const result = await compareScreenshots(screenshot, baselinePath);
    
    if (result.isFirstRun) {
      process.exit(0);
    } else if (result.hasDifferences) {
      process.exit(1);
    } else {
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