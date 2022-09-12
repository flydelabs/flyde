import React, { useRef, useState } from "react";

import { Loader } from "@flyde/flow-editor";
import { DynamicOutput, dynamicOutput } from "@site/../core/dist";

import {
  PlaygroundTemplate,
  PlaygroundTemplateProps,
} from "./_PlaygroundTemplate/PlaygroundTemplate";

import "./style.scss";

import counterFlow from "./_flows/react-counter/react-counter.flyde";

const META_DATA = {
  title: "React Counter Example",
  description: `In this example the output JSX is rendered into an element`,
  key: "react-counter",
};

const outputWithSub = (sub: any) => {
  const o = dynamicOutput();
  o.subscribe(sub);
  return o;
};

export default function ReactCounterExample(): JSX.Element {
  const [element, setElement] = useState<JSX.Element>(<div>Loading</div>);

  const result = useRef<DynamicOutput>(outputWithSub((jsx) => setElement(jsx)));

  const inputs = useRef({});

  const [flowProps, setFlowProps] = useState<PlaygroundTemplateProps["flowProps"]>({
    flow: counterFlow.flow,
    resolvedFlow: counterFlow.resolvedFlow,
    inputs: inputs.current,
    output: result.current,
  });

  return (
    <PlaygroundTemplate meta={META_DATA} flowProps={flowProps}>
      <div className="output-container">
        {/* <button onClick={() => setLog([])}>Clear</button> */}
        <div>
          <h3>Result</h3>
          <div>{element}</div>
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
