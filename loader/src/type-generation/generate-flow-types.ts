import { deserializeFlow } from "../serdes";
import { readFileSync, writeFileSync } from "fs";
import { join, basename } from "path";
import * as glob from "glob";

// Import types locally to avoid module resolution issues
interface FlydeFlow {
  node: {
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
  };
}

export interface FlowTypeInfo {
  inputs: Record<string, { type: string; description?: string; required: boolean }>;
  outputs: Record<string, { type: string; description?: string }>;
}

export function analyzeFlowTypes(flow: FlydeFlow): FlowTypeInfo {
  const inputs: Record<string, { type: string; description?: string; required: boolean }> = {};
  const outputs: Record<string, { type: string; description?: string }> = {};

  // Analyze inputs
  Object.entries(flow.node.inputs || {}).forEach(([key, inputDef]) => {
    const inputConfig = typeof inputDef === 'string' ? { mode: 'optional' as const, description: undefined } : inputDef;
    inputs[key] = {
      type: 'any', // We'll infer this from usage patterns in the future
      description: inputConfig?.description,
      required: inputConfig?.mode === 'required'
    };
  });

  // Analyze outputs
  Object.entries(flow.node.outputs || {}).forEach(([key, outputDef]) => {
    outputs[key] = {
      type: 'any', // We'll infer this from usage patterns in the future
      description: (outputDef as any)?.description
    };
  });

  return { inputs, outputs };
}

export function generateFlowTypeDeclaration(relativePath: string, typeInfo: FlowTypeInfo): string {
  const inputType = Object.keys(typeInfo.inputs).length > 0 
    ? `{\n${Object.entries(typeInfo.inputs).map(([key, info]) => 
        `  ${key}${info.required ? '' : '?'}: ${info.type};${info.description ? ` // ${info.description}` : ''}`
      ).join('\n')}\n}`
    : 'Record<string, never>';

  const outputType = Object.keys(typeInfo.outputs).length > 0
    ? `{\n${Object.entries(typeInfo.outputs).map(([key, info]) => 
        `  ${key}: ${info.type};${info.description ? ` // ${info.description}` : ''}`
      ).join('\n')}\n}`
    : 'Record<string, never>';

  const flowName = basename(relativePath, '.flyde').replace(/[^a-zA-Z0-9]/g, '_');
  
  return `// Auto-generated types for ${relativePath}
export interface ${flowName}Inputs ${inputType}

export interface ${flowName}Outputs ${outputType}

export type ${flowName}Flow = {
  inputs: ${flowName}Inputs;
  outputs: ${flowName}Outputs;
  path: "${relativePath}";
};
`;
}

export async function generateTypesForDirectory(rootDir: string, outputPath: string): Promise<void> {
  const flydeFiles = await new Promise<string[]>((resolve, reject) => {
    glob.glob("**/*.flyde", { cwd: rootDir }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
  
  let declarations = `// Auto-generated flow types
// This file is generated automatically. Do not edit manually.

import { LoadedFlowExecuteFn } from "../runtime";

`;

  const flowTypeMap: Record<string, string> = {};

  for (const filePath of flydeFiles) {
    try {
      const fullPath = join(rootDir, filePath);
      const flow = deserializeFlow(readFileSync(fullPath, 'utf8'), fullPath);
      const typeInfo = analyzeFlowTypes(flow);
      
      const declaration = generateFlowTypeDeclaration(filePath, typeInfo);
      declarations += declaration + '\n';

      const flowName = basename(filePath, '.flyde').replace(/[^a-zA-Z0-9]/g, '_');
      flowTypeMap[filePath] = `${flowName}Flow`;
    } catch (error) {
      console.warn(`Failed to generate types for ${filePath}:`, error);
    }
  }

  // Generate the flow registry
  declarations += `// Flow registry for type-safe loading
export type FlowRegistry = {\n${Object.entries(flowTypeMap).map(([path, type]) => 
    `  "${path}": ${type};`
  ).join('\n')}\n};\n\n`;

  // Generate the type-safe loadFlow function signature
  declarations += `// Type-safe loadFlow function
export function loadFlow<K extends keyof FlowRegistry>(
  flowPath: K,
  root?: string,
  secrets?: Record<string, string>
): LoadedFlowExecuteFn<FlowRegistry[K]["inputs"]>;

export function loadFlow<TInputs = any>(
  flowPath: string,
  root?: string,
  secrets?: Record<string, string>
): LoadedFlowExecuteFn<TInputs>;

export function loadFlow<TInputs = any>(
  flowPath: string,
  root?: string,
  secrets?: Record<string, string>
): LoadedFlowExecuteFn<TInputs> {
  // Implementation will delegate to the original loadFlow
  throw new Error("This is a type-only declaration. Use the implementation from runtime/index.ts");
}
`;

  writeFileSync(outputPath, declarations);
}