"use client";

import "@flyde/flow-editor/src/index.scss";
import {
  noop,
} from "@flyde/core";
import {
  DebuggerContextData,
  DebuggerContextProvider,
  FlowEditor,
  PortsContext,
  EditorPorts,
  defaultPorts,
  FlowEditorState,
  defaultBoardData,
} from "@flyde/flow-editor";
import React, {
  useState,
  useEffect,
  useMemo
} from "react";
import { ExampleChatbot } from "../flyde/resolved/ExampleChatbot";

export interface EmbeddedFlydeProps {

}

const initialPadding = [10, 10] as [number, number];

export const EmbeddedFlyde = (props: EmbeddedFlydeProps) => {
  const {

  } = props;

  const [internalEditorState, setInternalEditorState] =
    useState<FlowEditorState>({
      flow: {
        node: {
          instances: [],
          inputsPosition: {},
          outputsPosition: {},
          connections: [],
          inputs: {},
          outputs: {},
          id: "loading",
        },
      },
      boardData: defaultBoardData
    });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFlowData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load the ExampleChatbot flow data directly
        setInternalEditorState(prevState => ({
          ...prevState,
          flow: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            node: ExampleChatbot as any, // Cast to any to avoid type issues
          },
        }));
      } catch (err) {
        console.error('Error loading flow data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadFlowData();
  }, []);

  const debuggerContextValue = React.useMemo<DebuggerContextData>(() => {


    return {
      onRequestHistory: () => Promise.resolve({ lastSamples: [], total: 0 }),
      debuggerClient: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onBatchedEvents: noop as any,
      },
    };
  }, []);

  const portsContextValue = useMemo<EditorPorts>(() => {
    const ports: EditorPorts = {
      ...defaultPorts,
    };

    return ports;
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading flow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading flow</p>
          <p className="text-zinc-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const _DebuggerContextProvider = DebuggerContextProvider as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
  return (
    <PortsContext.Provider value={portsContextValue}>
      <DebuggerContextProvider value={debuggerContextValue}>
          <FlowEditor
            state={internalEditorState}
            onChangeEditorState={setInternalEditorState} 
            initialPadding={initialPadding}
            darkMode={true}
          />
      </DebuggerContextProvider>
    </PortsContext.Provider>
  );
};

// // there's a fraction of a second where the nodes are not positioned correctly in the canvas. TODO - fix this mega hack
// const CanvasPositioningWaitHack: React.FC<PropsWithChildren> = ({
//   children,
// }) => {
//   const [isReady, setIsReady] = useState(false);

//   useEffect(() => {
//     setIsReady(true);
//   }, []);

//   return (
//     <div className="embedded-wrapper flex-grow overflow-y-auto h-full relative">
//       <div className={`canvas-positioning-hack ${isReady ? "ready" : ""}`}>
//         {children}
//       </div>
//     </div>
//   );
// };

EmbeddedFlyde.displayName = "EmbeddedFlyde";
