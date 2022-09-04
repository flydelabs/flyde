import React, { useEffect, useRef, useState } from "react";
import { dynamicOutput, dynamicPartInput } from "@site/../core/dist";

import {
  PlaygroundTemplate,
  PlaygroundTemplateProps,
} from "./_PlaygroundTemplate/_PlaygroundTemplate";

import "./style.scss";

// const bundled = require("./flows/hello-world.bundled.json");
import helloWorldExample from "./_flows/hello-world.flyde";
import { OutputLogs } from "./_OutputLogs/OutputLogs";

const META_DATA = {
  title: "Hello World",
  description: `The mandatory "Hello World" example. Click on the execute button to see the output.\n This demonstrates one of the coolest features of Flyde - the ability to view your code running live!`,
  key: "hello-world",
};


const extraInfo = 'Great job. You can change the "Hello World" string by double-clicking it. Go ahead, try it now!';

export default function Home(): JSX.Element {
  const result = useRef(dynamicOutput());

  const inputs = useRef({
    __trigger: dynamicPartInput(),
  });

  const [showExtra, setShowExtra] = useState(false);

  const [flowProps, setFlowProps] = useState<PlaygroundTemplateProps["flowProps"]>({
    flow: {
      imports: {},
      exports: [],
      parts: helloWorldExample,
    },
    resolvedFlow: helloWorldExample,
    inputs: inputs.current,
    output: result.current,
  });

  useEffect(() => {
    result.current.subscribe((d) => {
      setShowExtra(true);
    });
  }, []);

  const prefixComponent = <button className='button button--primary' onClick={() => inputs.current.__trigger.subject.next("run")}>Run!</button>;

  return (
    <PlaygroundTemplate meta={META_DATA} flowProps={flowProps} hideDelay={true} prefixComponent={prefixComponent} initWidth={300} extraInfo={extraInfo} showExtra={showExtra}>
      <OutputLogs output={result.current}/>
      
    </PlaygroundTemplate>
  );
}
