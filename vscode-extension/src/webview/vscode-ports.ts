import { FlydeFlow } from "@flyde/core";

export interface VSCodePorts {
  setFlow: (params: { absPath: string; flow: FlydeFlow }) => void;
  onExternalFlowChange: (callback: (params: { flow: FlydeFlow }) => void) => () => void;
}

export const createVSCodePorts = (): VSCodePorts => {
  let externalFlowChangeCallback: ((params: { flow: FlydeFlow }) => void) | null = null;

  // Listen for messages from VS Code extension
  window.addEventListener('message', (event) => {
    const message = event.data;
    
    if (message.type === 'onExternalFlowChange' && externalFlowChangeCallback) {
      externalFlowChangeCallback({ flow: message.params.flow });
    }
  });

  return {
    setFlow: ({ absPath, flow }) => {
      // Send message to VS Code extension to save the flow
      const vscode = (window as any).acquireVsCodeApi?.();
      if (vscode) {
        vscode.postMessage({
          type: 'setFlow',
          requestId: Date.now().toString(),
          params: { absPath, flow }
        });
      }
    },

    onExternalFlowChange: (callback) => {
      externalFlowChangeCallback = callback;
      
      // Return cleanup function
      return () => {
        externalFlowChangeCallback = null;
      };
    }
  };
};