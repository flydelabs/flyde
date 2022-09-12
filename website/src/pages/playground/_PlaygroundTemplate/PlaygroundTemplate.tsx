import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import * as PubSub from "pubsub-js";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import clsx from "clsx";
import {
  createRuntimePlayer,
  fitViewPortToPart,
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
  ResolvedFlydeFlow,
  ResolvedFlydeRuntimeFlow,
} from "@flyde/core";
import { defaultViewPort } from "@site/../flow-editor/dist/grouped-part-editor";
import { createHistoryPlayer } from "../_lib/createHistoryPlayer";
import { createRuntimeClientDebugger } from "../_lib/createRuntimePlayerDebugger";
import styles from "../../index.module.css";

import "./PlaygroundTemplate.scss";
import "@flyde/flow-editor/src/index.scss";

import { Resizable } from 'react-resizable';
import produce from "immer";

(global as any).vm2 = fakeVm;

const historyPlayer = createHistoryPlayer();

export interface PlaygroundTemplateProps {
  meta: {
    title: string;
    key: string;
    description: string;
    extraInfo?: string;
  };
  flowProps: {
    inputs: Record<string, DynamicPartInput>;
    flow: FlydeFlow;
    resolvedFlow: ResolvedFlydeRuntimeFlow;
    output: PartOutput;
  };
  prefixComponent?: JSX.Element;
  extraInfo?: string;
  defaultDelay?: number;
  hideDelay?: boolean;
  initWidth?: number;
}

export type PlaygroundFlowDto = {
  flow: ResolvedFlydeRuntimeFlow;
  output: PartOutput;
  inputs: PartInputs;
  onError: any;
  debugDelay?: number;
  player: RuntimePlayer
};
const runFlow = ({ flow, output, inputs, onError, debugDelay, player }: PlaygroundFlowDto) => {
  const localDebugger = createRuntimeClientDebugger(player, historyPlayer);

  localDebugger.debugDelay = debugDelay;

  return execute({
    part: flow.main,
    inputs: inputs,
    outputs: { result: output },
    partsRepo: {...flow.dependencies, [flow.main.id]: flow.main},
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
  const { flow, inputs, output } = props.flowProps;

  const [childrenWidth, setChildrenWidth] = useState(props.initWidth || 500);

  const [debugDelay, setDebugDelay] = useState(props.defaultDelay || 0);

  const [outputReceived, setOutputReceived] = useState(false);

  const runtimePlayerRef = useRef(createRuntimePlayer(props.flowProps.flow.part.id));

  const [resolvedFlow, setResolvedFlow] = useState<ResolvedFlydeRuntimeFlow>(props.flowProps.resolvedFlow);

  const [editorState, setFlowEditorState] = useState<FlowEditorState>({
    flow,
    boardData: {
      viewPort: {
        pos: {x: 0, y: 0},
        zoom: 1
      },
      lastMousePos: { x: 0, y: 0 },
      selected: [],
    }
  });

  // useEffect(() => {
  //   setResolvedFlow((f) => ({...f, main: flow.part}))
  // }, [flow]);

  useEffect(() => {
    setResolvedFlow((f) => ({...f, main: editorState.flow.part}))
  }, [editorState.flow.part])

  const flowEditorProps: FlydeFlowEditorProps = {
    state: editorState,
    resolvedRepoWithDeps: resolvedFlow,
    onChangeState: setFlowEditorState,
    onInspectPin: noop,
    onRequestHistory: historyPlayer.requestHistory,
    hideTemplatingTips: true,
    onImportPart: noop,
  };

  useEffect(() => {
    runtimePlayerRef.current.start();
  }, []);

  useEffect(() => {
    const clean = runFlow({
      flow: resolvedFlow,
      output,
      inputs,
      onError: noop,
      debugDelay,
      player: runtimePlayerRef.current
    });
    return () => {
      clean();
    };
  }, [debugDelay, resolvedFlow]);

  const onResizeChildren = useCallback((_, {size}) => {
    setChildrenWidth(size.width);
    
    setFlowEditorState((state) => {
      const container = document.querySelector('.flow-container'); // yack
      const vpSize = container ? container.getBoundingClientRect() : {width: 500, height: 500};
      return produce(state, draft => {
        draft.boardData.viewPort = fitViewPortToPart(draft.flow.part as any, resolvedFlow.dependencies, vpSize);
      })
    })
  }, []);

  useEffect(() => {
    props.flowProps.output.subscribe(() => setOutputReceived(true));
  }, []);

  const debugDelayElem = (<div className='delay-container'>
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
  <label htmlFor="volume">Debug Delay: {debugDelay}ms</label>
</div>)

  return (
    <Layout
      title={`${props.meta.title} | Playground`}
      description={`Flyde Playground - ${props.meta.title} example`}
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
          <h2 className="playground-title">{props.meta.title}</h2>
          <div className="playground-description">{props.meta.description}</div>
          {outputReceived ? <Fragment><hr/><div className='playground-extra'>{props.extraInfo || props.meta.extraInfo}</div></Fragment> : null }
          {props.prefixComponent}
        </header>
        <div className="playground">
          <div className="flow-container">
              {props.hideDelay !== true ? debugDelayElem: null }
              <FlowEditor {...flowEditorProps} />
          </div>
          <Resizable height={0} width={childrenWidth} onResize={onResizeChildren} axis='x' handle={<div className='handle'/>} resizeHandles={['w']}>

          <div className="output-container" style={{flexBasis: childrenWidth}}>
            {props.children}
            </div>
            </Resizable>
        </div>
      </div>
    </Layout>
  );
};
