import React, { useEffect, useRef, useState } from "react";
import { dynamicOutput, dynamicPartInput } from "@site/../core/dist";

import { PlaygroundTemplate, PlaygroundTemplateProps } from "./_PlaygroundTemplate/_PlaygroundTemplate";

import "./style.scss";

// const bundled = require("./flows/hello-world.bundled.json");
import helloWorldExample from './flows/hello-world.flyde';

const META_DATA = {
  title: "Hello World",
  description: `The mandatory "Hello World" example. Click on the execute button to see the output.\n This demonstrates one of the coolest features of Flyde - the ability to view your code running live!`,
  key: "hello-world",
}

export default function Home(): JSX.Element {

  const result = useRef(dynamicOutput());

  const inputs = useRef({
    __trigger: dynamicPartInput()
  });

  const [log, setLog] = useState<string[]>([]);

  const [flowProps, setFlowProps] = useState<PlaygroundTemplateProps['flowProps']>({ flow: {
    imports: {},
    exports: [],
    parts: helloWorldExample,
  },
    resolvedFlow: helloWorldExample,
    inputs: inputs.current,
    output: result.current
  } );

  useEffect(() => {
    result.current.subscribe(d => {
      setLog(l => ([...l, d]));
    });
  }, []);

  return (
    <PlaygroundTemplate meta={META_DATA} flowProps={flowProps}>
        <button onClick={() => inputs.current.__trigger.subject.next('run')}>Execute</button>
        <button onClick={() => setLog([])}>Clear</button>
        <code>
          {log.map((o, i) => (
            <div key={i}>{o}</div>
          ))}
        </code>
    </PlaygroundTemplate>
  );
}
