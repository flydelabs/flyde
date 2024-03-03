import { EmbeddedFlyde } from "@site/src/components/EmbeddedFlyde/EmbeddedFlyde";
import React, { forwardRef, useMemo } from "react";

import { vs2015 } from "react-code-blocks";

const codeTheme = vs2015;

const flowFileName = "Example.flyde";
import clsx from "clsx";

const code = `import {loadFlow} from '@flyde/runtime';

const executeFlow = loadFlow('${flowFileName}');
const {result} = executeFlow();
const {output} = await result;
console.log(\`Output: \$\{output\}\`);`;

import "./HeroExample.scss";
import { Loader } from "@flyde/flow-editor";
import { processMacroNodes } from "@site/src/components/EmbeddedFlyde/macroHelpers";
import * as stdLibBrowser from "@flyde/stdlib/dist/all-browser";
import { noop } from "@flyde/core";
import { examples } from "../_examples";

export const HeroExample: React.FC<{
  example: (typeof examples)[0];
  ref: any;
  children?: React.ReactNode;
  onChangeExample: (example: (typeof examples)[0]) => void;
}> = forwardRef(function HeroExample(
  { example, children, onChangeExample },
  ref
) {
  const currentExample = example;
  const [logs, setLogs] = React.useState<any>([]);

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

  return (
    <div className="hero-example relative">
      <div className="hero-example__tabs">
        {examples.map((ex) => (
          <div
            onClick={() => onChangeExample(ex)}
            className={clsx("file-tag", ex === example && "selected")}
          >
            {ex.fileName}
          </div>
        ))}
      </div>

      <div className="flow-wrapper">
        <div className="loader-wrapper">
          <Loader />
        </div>
        <EmbeddedFlyde
          ref={ref}
          flowProps={flowProps}
          onLog={onLogOutput}
          onCompleted={noop}
        />
        {children}
      </div>
      <div className="terminal-wrapper">
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
});
