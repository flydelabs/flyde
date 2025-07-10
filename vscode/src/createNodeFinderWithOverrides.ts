import * as path from "path";
import * as fs from "fs";
import { createServerReferencedNodeFinder } from "@flyde/loader";
import { ReferencedNodeFinder } from "@flyde/loader/dist/resolver/ReferencedNodeFinder";
import { NodeInstance } from "@flyde/core";

/**
 * Creates a node finder that checks for .flyde-nodes.json overrides before
 * falling back to the default server-based node resolution.
 * 
 * This allows users to define custom nodes from external runtimes
 * by placing a .flyde-nodes.json file in the same directory as their flow file.
 * 
 * @param flowPath - The full path to the current flow file
 * @returns A ReferencedNodeFinder function that includes override support
 */
export function createNodeFinderWithOverrides(flowPath: string): ReferencedNodeFinder {
  const baseNodeFinder = createServerReferencedNodeFinder(flowPath);
  
  return (instance: NodeInstance) => {
    // Check if we have a .flyde-nodes.json override in the same directory
    const overridePath = path.join(path.dirname(flowPath), '.flyde-nodes.json');
    
    if (fs.existsSync(overridePath) && instance.source?.type === 'custom') {
      try {
        const overrideContent = fs.readFileSync(overridePath, 'utf8');
        const overrideData = JSON.parse(overrideContent);
        
        // Look for node definition in the nodes section
        if (overrideData.nodes && overrideData.nodes[instance.nodeId]) {
          const nodeDefinition = overrideData.nodes[instance.nodeId];
          // Return the editorNode part, which is what resolveEditorNode expects
          return nodeDefinition.editorNode;
        }
      } catch (err) {
        console.error("Error reading .flyde-nodes.json for node resolution:", err);
      }
    }
    
    // Fall back to default resolution
    return baseNodeFinder(instance);
  };
}