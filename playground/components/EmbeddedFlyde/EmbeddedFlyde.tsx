import { defaultNode } from "@/lib/defaultNode";
import { HistoryPlayer } from "@/lib/executeApp/createHistoryPlayer";
import {
  FlydeFlow,
  ImportedNode,
  InternalMacroNode,
  MacroNodeDefinition,
  isCodeNode,
  CodeNode,
  processImprovedMacro,
} from "@flyde/core";
import {
  FlowEditorState,
  DebuggerContextData,
  DebuggerContextProvider,
} from "@flyde/flow-editor";
import dynamic from "next/dynamic";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FullPageLoader } from "../FullPageLoader";

import { macroBundlesContent } from "../../stdlib-bundle/inline-macros";

export interface EmbeddedFlydeProps {
  flow: FlydeFlow;
  onChange: (flow: FlydeFlow) => void;
  localNodes: any[];
  historyPlayer: HistoryPlayer;
}

const initialPadding = [10, 10] as [number, number];

async function loadStdLib(): Promise<
  Record<string, Node | InternalMacroNode<any>>
> {
  return Object.values(await import("@flyde/stdlib/dist/all-browser"))
    .filter((n) => isCodeNode(n))
    .map((n) => {
      const node = processImprovedMacro(n as unknown as CodeNode<any>);
      const macroDef = node as unknown as MacroNodeDefinition<any>;

      if (macroDef.editorConfig.type !== "custom") {
        return macroDef;
      }

      const bundleBase64Content =
        macroBundlesContent[macroDef.id as keyof typeof macroBundlesContent];

      // macroDef.editorConfig.editorComponentBundleContent = bundleBase64Content
      //   ? atob(bundleBase64Content)
      //   : "";
      return macroDef;
    })
    .reduce<Record<string, any | InternalMacroNode<any>>>((acc, node: any) => {
      acc[node.id] = node;
      return acc;
    }, {});
}

const DynamicFlowEditor = dynamic(
  () => import("@flyde/flow-editor").then((m) => m.FlowEditor),
  {
    loading: () => <FullPageLoader />,
    ssr: false,
  }
);

const defaultState: FlowEditorState = {
  flow: {
    node: { ...defaultNode },
  },
  boardData: {
    viewPort: {
      pos: { x: 0, y: 0 },
      zoom: 1,
    },
    selectedInstances: [],
    selectedConnections: [],
    lastMousePos: { x: 0, y: 0 },
  },
};

export function EmbeddedFlyde(props: EmbeddedFlydeProps) {
  const { flow, localNodes, onChange, historyPlayer } = props;
  const [state, setState] = useState<FlowEditorState>({
    ...defaultState,
    flow,
  });

  const { flow: stateFlow } = state;

  useEffect(() => {
    // loadStdLib().then((stdlib) => {
    //   const { newDeps } = processMacroNodes(state.flow.node, stdlib);
    //   setResolvedDependencies({ ...stdlib, ...localNodes, ...newDeps } as any);
    // });
  }, [localNodes]);

  useEffect(() => {
    onChange(stateFlow);
  }, [onChange, stateFlow]);

  const debuggerContextValue = React.useMemo<DebuggerContextData>(
    () => ({
      onRequestHistory: historyPlayer.requestHistory,
    }),
    [historyPlayer.requestHistory]
  );

  return (
    <DebuggerContextProvider value={debuggerContextValue}>
      <CanvasPositioningWaitHack>
        <DynamicFlowEditor
          state={state}
          onChangeEditorState={setState}
          initialPadding={initialPadding}
        />
      </CanvasPositioningWaitHack>
    </DebuggerContextProvider>
  );
}

// there's a fraction of a second where the nodes are not positioned correctly in the canvas. TODO - fix this mega hack
function CanvasPositioningWaitHack(props: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <div className={`canvas-positioning-hack ${isReady ? "ready" : ""}`}>
      {props.children}
    </div>
  );
}
