import * as resolver from '@flyde/loader';
import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const examples = [
    'ExampleBlogpost',
    'ExampleChatbot'
];

// Create resolved directory if it doesn't exist
const resolvedDir = join(__dirname, '../flyde/resolved');
mkdirSync(resolvedDir, { recursive: true });

// Process each example
examples.forEach(exampleName => {
    const flowPath = join(__dirname, `../flyde/${exampleName}.flyde`);
    const flow = resolver.resolveFlowByPath(flowPath);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorNode = resolver.resolveEditorNode(flow as any, resolver.createServerReferencedNodeFinder(flowPath));
    
    // Write to TypeScript file
    const outputPath = join(resolvedDir, `${exampleName}.ts`);
    const content = `export const ${exampleName} = ${JSON.stringify(editorNode, null, 2)};`;
    writeFileSync(outputPath, content);
});