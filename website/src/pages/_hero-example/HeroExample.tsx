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
import { toastMsg } from "@flyde/flow-editor";

const RERUN_INTERVAL = 4200 * 2.5;

export const HeroExample: React.FC<{ example: (typeof examples)[0] }> = ({
  example,
}) => {
  const currentExample = example;
  const [logs, setLogs] = React.useState<any>([]);

  const [fileVisible, setFileVisible] = React.useState("Example.flyde");

  const inputs = useRef({
    __trigger: dynamicNodeInput(),
  });

  const result = useRef(dynamicOutput());
  const flowProps = {
    initialFlow: currentExample.flow.flow,
    dependencies: currentExample.flow.dependencies,
    inputs: inputs.current,
    output: result.current,
  };

  const onRunExample = React.useCallback(() => {
    inputs.current.__trigger.subject.next("run");
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRunExample();
    }, 1500);
    const interval = setInterval(() => {
      onRunExample();
    }, RERUN_INTERVAL);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onRunExample]);

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
          <EmbeddedFlyde
            flowProps={flowProps}
            debugDelay={100}
            onOutput={(output) => {
              setLogs((logs) => [
                `[${new Date().toLocaleTimeString()}] Output: ${output}`,
                ...logs,
              ]);
            }}
            // onCompleted={onCompleted}
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
        <div className="terminal-emulator">
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
