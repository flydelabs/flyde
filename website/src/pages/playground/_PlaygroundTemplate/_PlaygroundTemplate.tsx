import React, { useEffect, useRef, useState } from "react";
import * as PubSub from "pubsub-js";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import clsx from "clsx";
import {
  createRuntimePlayer,
  FlowEditor,
  FlowEditorState,
  FlydeFlowEditorProps,
  RuntimePlayer,
} from "@flyde/flow-editor";
import { fakeVm } from "@site/src/fake-vm";
import Link from "@docusaurus/Link";
import {
  DynamicPartInput,
  execute,
  FlydeFlow,
  keys,
  noop,
  PartDefRepo,
  PartInputs,
  PartOutput,
  PartRepo,
} from "@flyde/core";
import { defaultViewPort } from "@site/../flow-editor/dist/grouped-part-editor";
import { createHistoryPlayer } from "../_lib/createHistoryPlayer";
import { createRuntimeClientDebugger } from "../_lib/createRuntimePlayerDebugger";
import styles from "../../index.module.css";

import "./PlaygroundTemplate.scss";
import "@flyde/flow-editor/src/index.scss";
import BrowserOnly from "@docusaurus/BrowserOnly";

const deps = require("../_flows/bundle-deps.json");

(global as any).vm2 = fakeVm;

const historyPlayer = createHistoryPlayer();

export interface PlaygroundTemplateProps {
  meta: {
    title: string;
    key: string;
    description: string;
  };
  flowProps: {
    inputs: Record<string, DynamicPartInput>;
    flow: FlydeFlow;
    resolvedFlow: PartDefRepo;
    output: PartOutput;
  };
  defaultDelay?: number;
}

export type PlaygroundFlowDto = {
  parts: PartRepo;
  output: PartOutput;
  inputs: PartInputs;
  onError: any;
  mainId: string;
  debugDelay?: number;
  player: RuntimePlayer
};
const runFlow = ({ parts, output, inputs, onError, mainId, debugDelay, player }: PlaygroundFlowDto) => {
  const localDebugger = createRuntimeClientDebugger(player, historyPlayer);

  localDebugger.debugDelay = debugDelay;

  return execute({
    part: parts[mainId],
    inputs: inputs,
    outputs: { result: output },
    partsRepo: { ...deps, ...parts },
    _debugger: localDebugger,
    onBubbleError: (e) => {
      onError(e);
    },
    extraContext: {
      PubSub,
    },
  });
};

export const PlaygroundTemplate: React.FC<PlaygroundTemplateProps> = (props) => {
  const { siteConfig } = useDocusaurusContext();

  const { flow, inputs, output } = props.flowProps;

  const [debugDelay, setDebugDelay] = useState(props.defaultDelay || 0);

  const runtimePlayerRef = useRef(createRuntimePlayer(props.flowProps.flow.mainId));

  const [editorState, setFlowEditorState] = useState<FlowEditorState>({
    flow,
    boardData: {
      viewPort: {
        pos: {x: 0, y: 0},
        zoom: 1
      },
      lastMousePos: { x: 0, y: 0 },
      selected: [],
    },
    currentPartId: flow.mainId || keys(flow.parts)[0],
  });

  useEffect(() => {
    setFlowEditorState((state) => ({ ...state, flow }));
  }, [flow]);

  const [resolvedDeps, setResolvedDeps] = useState({ ...editorState.flow.parts, ...deps });

  const flowEditorProps: FlydeFlowEditorProps = {
    state: editorState,
    resolvedRepoWithDeps: resolvedDeps,
    onChangeState: setFlowEditorState,
    onInspectPin: noop,
    onRequestHistory: historyPlayer.requestHistory,
    hideTemplatingTips: false,
    onImportPart: noop,
  };

  useEffect(() => {
    runtimePlayerRef.current.start();
  }, []);

  useEffect(() => {
    setResolvedDeps({ ...deps, ...editorState.flow.parts });
  }, [editorState.flow.parts]);

  useEffect(() => {
    const clean = runFlow({
      parts: resolvedDeps,
      output,
      inputs,
      onError: noop,
      mainId: flow.mainId || "Main",
      debugDelay,
      player: runtimePlayerRef.current
    });
    return () => {
      clean();
    };
  }, [debugDelay, resolvedDeps]);

  return (
    <Layout
      title={`${props.meta.title} | Playground`}
      description="Description will go into a meta tag in <head />"
    >
      <header className={clsx("hero hero--primary", styles.heroBanner)}>
        <div className="container">
          <h2 className="hero__title">Flyde Playground</h2>
          <p className="hero__subtitle">
            Flyde's playground allows you to see how Flyde looks and feels like. Choose one of the
            examples below to get started. Feel free to play aroung with the canvas and see how your
            changes affect the result!
          </p>
          <ul className="examples__menu">
            <li>
              <Link to="/playground/hello">Hello World</Link>{" "}
            </li>
            <li>
              <Link to="/playground/debounce-throttling">Debounce vs. Throttling</Link>
            </li>
            <li>
              <Link to="/playground/react-counter">React Counter</Link>
            </li>
            <li>
              <Link to="/playground/fibonacci">Fibonnaci Sequence</Link>
            </li>
          </ul>
        </div>
      </header>

      <div className="playground-container">
        <header>
          <h3 className="playground-title">{props.meta.title}</h3>
          <div className="playground-description">{props.meta.description}</div>
          <div>
            <input
              type="range"
              id="volume"
              name="delay"
              value={debugDelay}
              step="100"
              min="0"
              max="300"
              onChange={(e) => setDebugDelay(Number(e.target.value))}
            />
            <label htmlFor="volume">Debug Delay - {debugDelay}ms</label>
          </div>
        </header>
        <div className="playground">
          <div className="flow-container">
              <FlowEditor {...flowEditorProps} />
          </div>
          <div className="output-container">{props.children}</div>
        </div>
      </div>
    </Layout>
  );
};
