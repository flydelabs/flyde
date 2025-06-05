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
  useMemo,
  forwardRef,
} from "react";


import * as bob from '@flyde/stdlib/dist/all-browser'


export interface EmbeddedFlydeProps {

}

const initialPadding = [10, 10] as [number, number];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const EmbeddedFlyde = forwardRef((props: EmbeddedFlydeProps, _: React.Ref<typeof FlowEditor>) => {
  const {

  } = props;

  const [internalEditorState, setInternalEditorState] =
    useState<FlowEditorState>({
      flow: {
        node: {
          instances: [
            {
              nodeId: 'add', source: { type: 'package', data: '@flyde/stdlib' }, id: 'a', pos: { x: 0, y: 0 }, inputConfig: {}, type: 'code', config: {},
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              node: { ...bob.Add, icon: 'add' } as any
            }
          ],
          inputsPosition: {},
          outputsPosition: {},
          connections: [],
          inputs: {},
          outputs: {},
          id: "1",
        },
      },
      boardData: defaultBoardData
    });

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


  return (
    <PortsContext.Provider value={portsContextValue}>
      <DebuggerContextProvider value={debuggerContextValue}>
        <CanvasPositioningWaitHack>
          <FlowEditor
            state={internalEditorState}
            onChangeEditorState={setInternalEditorState}
            initialPadding={initialPadding}
            darkMode={true}
          />
        </CanvasPositioningWaitHack>
      </DebuggerContextProvider>
    </PortsContext.Provider>
  );
});

// there's a fraction of a second where the nodes are not positioned correctly in the canvas. TODO - fix this mega hack
function CanvasPositioningWaitHack(props: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <div className="embedded-wrapper flex-grow overflow-y-auto h-full relative">
      <div className={`canvas-positioning-hack ${isReady ? "ready" : ""}`}>
        {props.children}
      </div>
    </div>
  );
}

EmbeddedFlyde.displayName = "EmbeddedFlyde";
