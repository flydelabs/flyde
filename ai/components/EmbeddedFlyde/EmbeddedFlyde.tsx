import {
  FlydeFlow,
  ResolvedDependencies,
  isBaseNode,
  ImportedNode,
  isMacroNode,
  Node,
  MacroNode,
  MacroNodeDefinition,
} from "@flyde/core";
import {
  FlowEditorState,
  DependenciesContextData,
  DebuggerContextData,
  DependenciesContextProvider,
  DebuggerContextProvider,
} from "@flyde/flow-editor";
import dynamic from "next/dynamic";
import React, { useState, useEffect, useCallback, useMemo } from "react";

import "@flyde/flow-editor/src/index.scss";

import { getLibraryData } from "./getLibraryData";
import { processMacroNodes } from "./macroHelpers";

const macroBundlesContent = {} as any;

export interface EmbeddedFlydeProps {
  flow: FlydeFlow;
  onChange: (flow: FlydeFlow) => void;
  localNodes: ResolvedDependencies;
  historyPlayer: any;
}

const noop = () => {};

const initialPadding = [10, 10] as [number, number];

async function loadStdLib(): Promise<Record<string, Node | MacroNode<any>>> {
  return Object.values(await import("@flyde/stdlib/dist/all-browser"))
    .filter((n) => isBaseNode(n) || isMacroNode(n))
    .map((n) => {
      if (isMacroNode(n)) {
        const macroDef = n as unknown as MacroNodeDefinition<any>;

        if (macroDef.editorConfig.type !== "custom") {
          return macroDef;
        }

        const bundleBase64Content =
          macroBundlesContent[macroDef.id as keyof typeof macroBundlesContent];

        macroDef.editorConfig.editorComponentBundleContent = bundleBase64Content
          ? atob(bundleBase64Content)
          : "bla";
        return macroDef;
      } else {
        return n;
      }
    })
    .reduce<Record<string, Node | MacroNode<any>>>((acc, node: any) => {
      acc[node.id] = node;
      return acc;
    }, {});
}

const DynamicFlowEditor = dynamic(
  () => import("@flyde/flow-editor").then((m) => m.FlowEditor),
  {
    loading: () => <div />,
    ssr: false,
  }
);

const defaultState: FlowEditorState = {
  flow: {
    node: {} as any,
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
  const [resolvedDependencies, setResolvedDependencies] =
    useState<ResolvedDependencies>({});

  useEffect(() => {
    loadStdLib().then((stdlib) => {
      const { newDeps } = processMacroNodes(state.flow.node, stdlib);

      setResolvedDependencies({ ...stdlib, ...localNodes, ...newDeps } as any);
    });
  }, [localNodes, state.flow.node]);

  useEffect(() => {
    onChange(stateFlow);
  }, [onChange, stateFlow]);

  const onRequestImportables: DependenciesContextData["onRequestImportables"] =
    useCallback(async () => {
      const stdLibNodes = Object.values(
        await import("@flyde/stdlib/dist/all-browser")
      ).filter((n) => isBaseNode(n) || isMacroNode(n)) as ImportedNode[];

      const _stdLibNodes = stdLibNodes.map((b) => ({
        node: { ...b, source: { path: "n/a", export: "n/a" } },
        module: "@flyde/stdlib",
      }));

      const localModules = Object.values(localNodes).map((node) => ({
        node: { ...node, source: { path: "n/a", export: "n/a" } },
        module: "local",
      }));

      return {
        importables: [..._stdLibNodes, ...localModules],
        errors: [],
      };
    }, [localNodes]);

  const depsContextValue = useMemo<DependenciesContextData>(() => {
    return {
      resolvedDependencies,
      onImportNode: noop as any,
      onRequestImportables,
      onRequestSiblingNodes: () => Promise.resolve([]),
      libraryData: getLibraryData(),
    };
  }, [resolvedDependencies, onRequestImportables]);

  const debuggerContextValue = React.useMemo<DebuggerContextData>(
    () => ({
      onRequestHistory: historyPlayer.requestHistory,
    }),
    [historyPlayer.requestHistory]
  );

  if (Object.keys(resolvedDependencies).length === 0) {
    return <div />;
  }

  return (
    <DependenciesContextProvider value={depsContextValue}>
      <DebuggerContextProvider value={debuggerContextValue}>
        <CanvasPositioningWaitHack>
          <DynamicFlowEditor
            state={state}
            onChangeEditorState={setState}
            initialPadding={initialPadding}
            onExtractInlineNode={noop as any}
          />
        </CanvasPositioningWaitHack>
      </DebuggerContextProvider>
    </DependenciesContextProvider>
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
