import { dynamicOutput, dynamicNodeInput, noop } from "@site/../core/dist";
import { EmbeddedFlyde } from "@site/src/components/EmbeddedFlyde/EmbeddedFlyde";
import React, { useRef } from "react";

import helloWorldExample from "./Hero.flyde";

import { CodeBlock, dracula } from "react-code-blocks";

const code = `import {loadFlow} from '@flyde/runtime';

const executeFlow = loadFlow('Greet.flyde');
const {result} = executeFlow();
const {output} = await result;
console.log(\`Output: \$\{output\}\`);`;

import "./HeroExample.scss";
import { Button } from "@blueprintjs/core";
import Link from "@docusaurus/Link";

export const HeroExample: React.FC = () => {
  const [logs, setLogs] = React.useState<any>([]);

  const inputs = useRef({
    __trigger: dynamicNodeInput(),
  });

  const result = useRef(dynamicOutput());
  const flowProps = {
    flow: helloWorldExample.flow,
    dependencies: helloWorldExample.dependencies,
    inputs: inputs.current,
    output: result.current,
  };

  const [didRun, setDidRun] = React.useState(false);

  const onRunExample = () => {
    setLogs(["› ts-node index.ts"]);
    inputs.current.__trigger.subject.next("run");
    setDidRun(true);
  };

  return (
    <div className="hero-example">
      <div className="buttons-container">
        <Link className="button button--secondary" to="/playground">
          Online Playground
        </Link>
        <Button
          className={`button button--success button${!didRun && " nudge"}`}
          onClick={onRunExample}
        >
          Run Example 👇
        </Button>
        <Link
          className="button button--primary"
          href="https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode"
        >
          VSCode Extension
        </Link>
        <span className="gh-stars-wrapper">
          <iframe
            className="gh-stars-frame"
            src="https://ghbtns.com/github-btn.html?user=flydelabs&amp;repo=flyde&amp;type=star&amp;count=true&amp;size=large"
            width={160}
            height={30}
            title="GitHub Stars"
          />
        </span>
      </div>
      <div className="flyde-hero-example-wrapper">
        <div className="flow-wrapper">
          <div className="file-tag">Greet.flyde</div>
          <EmbeddedFlyde
            flowProps={flowProps}
            debugDelay={100}
            onOutput={(output) => {
              setLogs((logs) => [...logs, `Output: ${output}`]);
            }}
          />
        </div>
        <div className="code-terminal-wrapper">
          <div className="code-wrapper">
            <div className="file-tag">index.ts</div>
            <CodeBlock
              className="code-example"
              showLineNumbers={false}
              text={code}
              language="typescript"
              theme={dracula}
              codeBlock
            />
          </div>
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
      </div>
    </div>
  );
};
