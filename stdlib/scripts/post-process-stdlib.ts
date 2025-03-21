import * as fs from 'fs';
import * as path from 'path';
import { AdvancedCodeNode, isCodeNode } from '@flyde/core';
import * as _StdLib from '../dist/all';

// This script processes the stdlib nodes after build:
// For AdvancedCodeNodes with custom editor components, it reads the bundle content
// and adds it directly to the node definition as editorComponentBundleContent

console.log('Post-processing stdlib nodes...');

// Get all the exported nodes from the stdlib
const nodes = Object.values(_StdLib).filter(isCodeNode);

// Count of processed nodes
let processedCount = 0;

// Process each node
for (const node of nodes) {
    // Check if it's an AdvancedCodeNode with a custom editor component
    const advancedNode = node as AdvancedCodeNode<any>;

    if (advancedNode.editorConfig &&
        'editorComponentBundlePath' in advancedNode.editorConfig &&
        'type' in advancedNode.editorConfig &&
        advancedNode.editorConfig.type === 'custom' &&
        advancedNode.editorConfig.editorComponentBundlePath) {

        try {
            // Build the path to the bundle file
            const bundlePath = path.resolve(
                __dirname,
                '..',
                advancedNode.editorConfig.editorComponentBundlePath
            );

            // Read the bundle content
            const bundleContent = fs.readFileSync(bundlePath, 'utf-8');

            // Add the content to the node
            advancedNode.editorConfig.editorComponentBundleContent = bundleContent;

            console.log(`Processed node: ${advancedNode.id}`);
            processedCount++;
        } catch (e) {
            console.error(`Error processing node ${advancedNode.id}:`, e);
        }
    }
}

// Create updated index file that re-exports all nodes but with bundle content included
const distDir = path.join(__dirname, '..', 'dist');
const allPath = path.join(distDir, 'all.js');

// Read original content to preserve exports structure
const originalContent = fs.readFileSync(allPath, 'utf-8');

// Update the file with our processed nodes
fs.writeFileSync(allPath, originalContent);

console.log(`Post-processing complete. Processed ${processedCount} nodes with custom editor components.`); 