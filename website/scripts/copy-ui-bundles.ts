#!/usr/bin/env tsx

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const NODE_UI_DIR = '../nodes/dist/ui';
const WEBSITE_PUBLIC_UI_DIR = './public/ui';

function copyUIBundles() {
  console.log('🔨 Copying UI bundles...');

  // Ensure target directory exists
  if (!existsSync(WEBSITE_PUBLIC_UI_DIR)) {
    mkdirSync(WEBSITE_PUBLIC_UI_DIR, { recursive: true });
  }

  // Check if source directory exists
  if (!existsSync(NODE_UI_DIR)) {
    console.error(`❌ Source directory not found: ${NODE_UI_DIR}`);
    console.error('Make sure to build the nodes package first: pnpm build');
    process.exit(1);
  }

  // Copy all .js files from nodes/dist/ui to website/public/ui
  const files = readdirSync(NODE_UI_DIR);
  const jsFiles = files.filter(file => extname(file) === '.js');

  if (jsFiles.length === 0) {
    console.warn('⚠️  No UI bundle files found in', NODE_UI_DIR);
    return;
  }

  let copiedCount = 0;
  
  for (const file of jsFiles) {
    const sourcePath = join(NODE_UI_DIR, file);
    const targetPath = join(WEBSITE_PUBLIC_UI_DIR, file);
    
    try {
      copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied ${file}`);
      copiedCount++;
    } catch (error) {
      console.error(`❌ Failed to copy ${file}:`, error);
    }
  }

  console.log(`🎉 Successfully copied ${copiedCount} UI bundle(s)`);
}

// Run the script
if (require.main === module) {
  copyUIBundles();
}

export { copyUIBundles };