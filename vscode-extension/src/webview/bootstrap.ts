import { EditorVisualNode } from "@flyde/core";

export interface BootstrapData {
  initialNode: EditorVisualNode;
  port: number;
  relativeFile: string;
  executionId: string;
  hasOpenAiToken: boolean;
  darkMode: boolean;
}

export const getBootstrapData = (): BootstrapData | null => {
  // Check for query param first (for testing)
  const urlParams = new URLSearchParams(window.location.search);
  const dummyData = urlParams.get('dummy');
  
  if (dummyData === 'true') {
    // Return dummy bootstrap data for testing
    return {
      initialNode: {
        id: 'test-node',
        inputs: {},
        outputs: {},
        instances: [],
        connections: [],
        inputsPosition: 'left',
        outputsPosition: 'right'
      },
      port: 3030,
      relativeFile: 'test.flyde',
      executionId: 'test-execution',
      hasOpenAiToken: false,
      darkMode: false
    };
  }
  
  try {
    const rawData = (window as any).__bootstrapData;
    if (!rawData) {
      return null;
    }
    const decodedData = decodeURIComponent(escape(atob(rawData)));
    return JSON.parse(decodedData);
  } catch (error) {
    console.error("Failed to parse bootstrap data:", error);
    return null;
  }
};