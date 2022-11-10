import React, { useRef, useState } from "react";

import { DynamicOutput, dynamicOutput } from "@site/../core/dist";

import {
  PlaygroundTemplate,
  PlaygroundTemplateProps,
} from "./_PlaygroundTemplate/PlaygroundTemplate";

import "./style.scss";

import counterFlow from "./_flows/react-counter/react-counter.flyde";
import { OutputJsx } from "./_OutputLogs/OutputJsx";

const META_DATA = {
  title: "React Counter Example",
  description: `This examples how Flyde can be used to build functional reactive UIs using React! Each time the "jsx" output receives a new value, it is rendered to the output pane.`,
  key: "react-counter",
  extraInfo: 'Another powerful feature of Flyde is that a part can have more than 1 output. For example, "Button" outputs JSX, but also outputs "click" signals. Cool, right?'
  
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
        <OutputJsx element={element}/>
    </PlaygroundTemplate>
  );
}
