import React, { Fragment, useCallback, useState } from "react";
import * as PubSub from "pubsub-js";
import Layout from "@theme/Layout";
import clsx from "clsx";
import { RuntimePlayer } from "@flyde/flow-editor";
import { fakeVm } from "@site/src/fake-vm";
import Link from "@docusaurus/Link";
import {
  DynamicNodeInput,
  execute,
  FlydeFlow,
  keys,
  NodeInputs,
  NodeOutput,
  ResolvedDependencies,
  ResolvedFlydeRuntimeFlow,
} from "@flyde/core";
import { createHistoryPlayer } from "../../../components/EmbeddedFlyde/createHistoryPlayer";
import { createRuntimeClientDebugger } from "../../../components/EmbeddedFlyde/createRuntimePlayerDebugger";
import styles from "../../index.module.css";

import "./PlaygroundTemplate.scss";
import "@flyde/flow-editor/src/index.scss";

import { Resizable } from "react-resizable";
import { EmbeddedFlyde } from "@site/src/components/EmbeddedFlyde/EmbeddedFlyde";

const historyPlayer = createHistoryPlayer();

const EXAMPLES_LIST = [
  {
    title: "Hello World",
    key: "hello-world",
  },
  {
    title: "React Counter",
    key: "react-counter",
  },
  {
    title: "BMI Calculator",
    key: "bmi",
  },
  {
    title: "REST API Usage",
    key: "apis",
  },
  {
    title: "Debounce vs. Throttling",
    key: "debounce-throttling",
  },
  {
    title: "Fibonacci Seq.",
    key: "fibonacci",
  },
];

export interface PlaygroundTemplateProps {
  meta: {
    title: string;
    key: string;
    description: string;
    extraInfo?: string | JSX.Element;
  };
  flowProps: {
    inputs: Record<string, DynamicNodeInput>;
    flow: FlydeFlow;
    dependencies: ResolvedDependencies;
    output: NodeOutput;
  };
  prefixComponent?: JSX.Element;
  extraInfo?: string;
  defaultDelay?: number;
  hideDelay?: boolean;
  initWidth?: number;
}

export type PlaygroundFlowDto = {
  flow: ResolvedFlydeRuntimeFlow;
  output: NodeOutput;
  inputs: NodeInputs;
  onError: any;
  debugDelay?: number;
  player: RuntimePlayer;
};

const runFlow = ({
  flow,
  output,
  inputs,
  onError,
  debugDelay,
  player,
}: PlaygroundFlowDto) => {
  const localDebugger = createRuntimeClientDebugger(player, historyPlayer);

  localDebugger.debugDelay = debugDelay;

  const firstOutputName = keys(flow.main.outputs)[0];

  return {
    executeResult: execute({
      node: flow.main,
      inputs: inputs,
      outputs: { [firstOutputName]: output },
      resolvedDeps: flow.dependencies,
      _debugger: localDebugger,
      onBubbleError: (e) => {
        onError(e);
      },
      extraContext: {
        PubSub,
      },
    }),
    localDebugger,
  };
};

export const PlaygroundTemplate: React.FC<PlaygroundTemplateProps> = (
  props
) => {
  const [childrenWidth, setChildrenWidth] = useState(props.initWidth || 500);

  const [debugDelay, setDebugDelay] = useState(props.defaultDelay || 0);

  const [outputReceived, setOutputReceived] = useState(false);

  const onResizeChildren = useCallback((_, { size }) => {
    setChildrenWidth(size.width);

    // setFlowEditorState((state) => {
    //   const container = document.querySelector(".flow-container"); // yack
    //   const vpSize = container
    //     ? container.getBoundingClientRect()
    //     : { width: 500, height: 500 };
    //   return produce(state, (draft) => {
    //     draft.boardData.viewPort = fitViewPortToNode(
    //       draft.flow.node as any,
    //       resolvedFlow.dependencies,
    //       vpSize
    //     );
    //   });
    // });
  }, []);

  const debugDelayElem = (
    <div className="delay-container">
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
    </div>
  );

  const exampleIdx = EXAMPLES_LIST.findIndex((ex) => ex.key === props.meta.key);
  const nextExample = EXAMPLES_LIST[exampleIdx + 1];
  const prevExample = EXAMPLES_LIST[exampleIdx - 1];

  return (
    <Layout
      title={`${props.meta.title} | Playground`}
      description={`Flyde Playground - ${props.meta.title} example`}
    >
      <header
        className={clsx(
          "hero hero--primary",
          styles.heroBanner,
          "playground-hero"
        )}
      >
        <div className="container">
          <h1 className="hero__title">Welcome to Flyde's Online Playground</h1>
          <p className="hero__subtitle">
            Choose one of the examples below to get started. Feel free to play
            around with the canvas and see how your changes affect the result!
          </p>
        </div>
      </header>

      <div className="mobile-warning">
        Flyde is currently not optimized for mobile devices. Please{" "}
        <strong>use a desktop computer for the best experience</strong>.
      </div>

      <ul className="examples__menu">
        {EXAMPLES_LIST.map((ex) => {
          return (
            <li key={ex.key}>
              <Link
                to={`/playground/${ex.key}`}
                className="button button--primary"
              >
                {ex.title}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="playground-container">
        <header>
          <h2 className="playground-title">{props.meta.title}</h2>
          <div className="playground-description">{props.meta.description}</div>
          {outputReceived ? (
            <Fragment>
              <hr />
              <div className="playground-extra">
                {props.extraInfo || props.meta.extraInfo}
                <div className="star-hint">
                  <span>&nbsp; PS: Did you like this example?</span>
                  Please consider giving a ⭐️ to the project{" "}
                  <span className="star-wrapper">
                    <iframe
                      className="gh-stars-frame"
                      src="https://ghbtns.com/github-btn.html?user=flydelabs&amp;repo=flyde&amp;type=star&amp;count=true&amp;size=small"
                      width={100}
                      height={20}
                      title="GitHub Stars"
                    />
                  </span>
                </div>
              </div>
            </Fragment>
          ) : null}
          {props.prefixComponent}
        </header>
        <div className="playground">
          <div className="flow-container">
            {props.hideDelay !== true ? debugDelayElem : null}
            <EmbeddedFlyde
              flowProps={props.flowProps}
              debugDelay={debugDelay}
              onOutput={() => setOutputReceived(true)}
            />
          </div>
          <Resizable
            height={0}
            width={childrenWidth}
            onResize={onResizeChildren}
            axis="x"
            handle={<div className="handle" />}
            resizeHandles={["w"]}
          >
            <div
              className="output-container"
              style={{ flexBasis: childrenWidth }}
            >
              {props.children}
            </div>
          </Resizable>
        </div>

        <nav className="pagination-nav">
          <div className="pagination-nav__item">
            {prevExample ? (
              <a
                className="pagination-nav__link"
                href={`/playground/${prevExample.key}`}
              >
                <div className="pagination-nav__sublabel">Previous Example</div>
                <div className="pagination-nav__label">{prevExample.title}</div>
              </a>
            ) : null}
          </div>
          <div className="pagination-nav__item pagination-nav__item--next">
            {nextExample ? (
              <a
                className="pagination-nav__link"
                href={`/playground/${nextExample.key}`}
              >
                <div className="pagination-nav__sublabel">Next Example</div>
                <div className="pagination-nav__label">{nextExample.title}</div>
              </a>
            ) : null}
          </div>
        </nav>
      </div>
    </Layout>
  );
};
