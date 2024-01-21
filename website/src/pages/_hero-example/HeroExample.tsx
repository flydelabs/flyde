import { dynamicOutput, dynamicNodeInput, noop } from "@site/../core/dist";
import { EmbeddedFlyde } from "@site/src/components/EmbeddedFlyde/EmbeddedFlyde";
import React, { useRef } from "react";

import { CodeBlock, vs2015 } from "react-code-blocks";

const codeTheme = vs2015;

const flowFileName = "Example.flyde";
import clsx from "clsx";

const code = `import {loadFlow} from '@flyde/runtime';

const executeFlow = loadFlow('${flowFileName}');
const {result} = executeFlow();
const {output} = await result;
console.log(\`Output: \$\{output\}\`);`;

import "./HeroExample.scss";
import { examples } from "..";
import { Loader, createRuntimePlayer } from "@flyde/flow-editor";
import { createHistoryPlayer } from "@site/src/components/EmbeddedFlyde/createHistoryPlayer";
import { runFlow } from "./runFlow";

const RERUN_INTERVAL = 4200 * 2.5;

export const HeroExample: React.FC<{ example: (typeof examples)[0] }> = ({
  example,
}) => {
  const currentExample = example;
  const [logs, setLogs] = React.useState<any>([]);

  const [fileVisible, setFileVisible] = React.useState("Example.flyde");

  const runtimeHandle = useRef<{ stop?: () => void }>({});

  const [historyPlayer, setHistoryPlayer] = React.useState<any>(
    createHistoryPlayer()
  );

  const [runtimePlayer, setRuntimePlayer] = React.useState<any>(
    createRuntimePlayer()
  );

  const flowProps = {
    initialFlow: currentExample.flow.flow,
    dependencies: currentExample.flow.dependencies,
  };

  const onRunExample = React.useCallback(() => {
    console.log(4242, runtimeHandle.current);

    const { executeResult } = runFlow({
      flow: currentExample.flow.flow,
      dependencies: currentExample.flow.dependencies,
      inputs: {},
      output: dynamicOutput(),
      onError: noop,
      historyPlayer,
      runtimePlayer,
    });

    // (window as any).__Bbo = runtimeHandle.current;
    // runtimeHandle.current.stop?.();
    // inputs.current.__trigger.subject.next("run");
  }, []);

  // const onCompleted = React.useCallback(() => {
  //   setLogs((logs) => [
  //     ...logs,
  //     "-- Flow completed, re-running in 3 seconds -- ",
  //   ]);
  //   setTimeout(() => {
  //     onRunExample();
  //   }, 3000);
  // }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRunExample();
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [onRunExample]);

  const logsContainerRef = React.useRef<HTMLDivElement>(null);

  const onLogOutput = React.useCallback(
    (output) => {
      setLogs((logs) => [
        ...logs,
        `[${new Date().toLocaleTimeString()}] Output: ${output}`,
      ]);

      if (logsContainerRef.current) {
        logsContainerRef.current.scrollTop =
          logsContainerRef.current.scrollHeight;
      }
    },
    [setLogs]
  );

  return (
    <div className="hero-example">
      <div className="hero-example__tabs">
        <div
          onClick={() => setFileVisible(flowFileName)}
          className={clsx(
            "file-tag",
            fileVisible === flowFileName && "selected"
          )}
        >
          {flowFileName}
        </div>
        <div
          className={clsx("file-tag", fileVisible === "index.ts" && "selected")}
          onClick={() => setFileVisible("index.ts")}
        >
          index.ts
        </div>
      </div>
      {/* <main> */}
      {fileVisible === flowFileName ? (
        <div className="flow-wrapper">
          <div className="loader-wrapper">
            <Loader />
          </div>
          <EmbeddedFlyde
            flowProps={flowProps}
            localDebugger={undefined as any}
            historyPlayer={historyPlayer}
          />
        </div>
      ) : null}
      {fileVisible === "index.ts" ? (
        <div className="code-wrapper">
          <CodeBlock
            className="code-example"
            showLineNumbers={false}
            text={code}
            language="typescript"
            theme={codeTheme}
            codeBlock
            width="100%"
          />
        </div>
      ) : null}
      {/* </main> */}
      <div className="terminal-wrapper">
        <div className="file-tag">Terminal</div>
        <div className="terminal-emulator" ref={logsContainerRef}>
          {logs.length ? (
            logs.map((log, i) => <div>{log}</div>)
          ) : (
            <em>Waiting for the example to run..</em>
          )}
        </div>
      </div>
    </div>
  );
};
