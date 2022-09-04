import React, { useCallback, useRef, useState } from "react";

import { dynamicOutput, dynamicPartInput } from "@site/../core/dist";

import {
  PlaygroundTemplate,
  PlaygroundTemplateProps,
} from "./_PlaygroundTemplate/PlaygroundTemplate";

import "@flyde/flow-editor/src/index.scss";
import "./style.scss";

// const bundled = require("./flows/hello-world.bundled.json");
import fiboFlow from "./_flows/fibonacci.flyde";

const META_DATA = {
  title: "Fibonacci Sequence",
  description: `This example showcases a classical recursion - the Fibonacci sequence. On numbers higher than 1, the "Fibonacci" part calls itself recursively!`,
  key: "fibo",
};

const outputWithSub = (sub: any) => {
  const o = dynamicOutput();
  o.subscribe(sub);
  return o;
};

export default function ReactCounterExample(): JSX.Element {
  const [val, setVal] = useState(4);
  const [fib, setFib] = useState(5);

  const result = useRef(outputWithSub((res) => setFib(res)));

  const inputs = useRef({ n: dynamicPartInput() });

  const [flowProps, setFlowProps] = useState<PlaygroundTemplateProps["flowProps"]>({
    flow: {
      imports: {},
      exports: [],
      parts: fiboFlow,
      mainId: "Fibonacci",
    },
    resolvedFlow: fiboFlow,
    inputs: inputs.current,
    output: result.current,
  });

  const onCalc = useCallback(() => {
    if (
      val <= 8 ||
      confirm(
        `This is an unoptimized Fib. calculator and larger numbers might take a long time to calculate. Are you sure?`
      )
    ) {
      inputs.current.n.subject.next(val);
    }
  }, [val]);

  return (
    <PlaygroundTemplate meta={META_DATA} flowProps={flowProps} defaultDelay={100}>
      <div className="output-container">
        {/* <button onClick={() => setLog([])}>Clear</button> */}
        <div>
          <input
            type="number"
            value={val}
            max={10}
            onChange={(e) => setVal(Number(e.target.value))}
          />
          <button onClick={onCalc}>Calculate!</button>
          <h3>Result: {fib}</h3>
        </div>
        {/* <code>
          {log.map((o, i) => (
            <div key={i}>{o}</div>
          ))}
        </code> */}
      </div>
    </PlaygroundTemplate>
  );
}
