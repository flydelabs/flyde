import { EmbeddedFlyde } from "@site/src/components/EmbeddedFlyde/EmbeddedFlyde";
import React, { useMemo } from "react";

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
import { Loader } from "@flyde/flow-editor";
import { processMacroNodes } from "@site/src/components/EmbeddedFlyde/macroHelpers";
import * as stdLibBrowser from "@flyde/stdlib/dist/all-browser";

export const HeroExample: React.FC<{ example: (typeof examples)[0] }> = ({
  example,
}) => {
  const currentExample = example;
  const [logs, setLogs] = React.useState<any>([]);

  const [fileVisible, setFileVisible] = React.useState("Example.flyde");

  const flowProps = useMemo(() => {
    const { newDeps, newNode } = processMacroNodes(
      currentExample.flow.flow.node,
      stdLibBrowser
    );

    return {
      initialFlow: { ...currentExample.flow.flow, node: newNode },
      dependencies: { ...currentExample.flow.dependencies, ...newDeps },
    };
  }, [currentExample]);

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

  const onCompleted = React.useCallback(() => {
    setLogs((logs) => [
      ...logs,
      "-- Flow completed, re-running in 3 seconds -- ",
    ]);
  }, []);

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
      {fileVisible === flowFileName ? (
        <div className="flow-wrapper">
          <div className="loader-wrapper">
            <Loader />
          </div>
          <EmbeddedFlyde
            flowProps={flowProps}
            onLog={onLogOutput}
            onCompleted={onCompleted}
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
            logs.map((log, i) => <div key={i}>{log}</div>)
          ) : (
            <em>Values sent to `output` will appear here once received.</em>
          )}
        </div>
      </div>
    </div>
  );
};
