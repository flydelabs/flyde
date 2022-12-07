import React, { useEffect, useRef, useState } from "react";
import { dynamicOutput, dynamicPartInput } from "@site/../core/dist";

import {
  PlaygroundTemplate,
  PlaygroundTemplateProps,
} from "./_PlaygroundTemplate/PlaygroundTemplate";

import "./style.scss";

// const bundled = require("./flows/hello-world.bundled.json");
import helloWorldExample from "./_flows/hello-world.flyde";
import { OutputLogs } from "./_OutputLogs/OutputLogs";


const META_DATA = {
  title: "Hello World",
  description: `The mandatory "Hello, World!" example. This flow will first output "Hello", wait 3 seconds and output "World!". Click on the "Run" button bellow to run see for yourself!.\n This demonstrates one of the most powerful features of Flyde - the ability to view it running live! PS: The delay part is there just to make the flow longer `,
  key: "hello-world",
};

const extraInfo = 'Great job. You can change the strings  double-clicking them. Double click on the green "ms: 3000" to edit the delay threshold. Go ahead, try it now!';

export default function Home(): JSX.Element {
  const result = useRef(dynamicOutput());

  const inputs = useRef({
    __trigger: dynamicPartInput(),
  });

  const [flowProps, setFlowProps] = useState<PlaygroundTemplateProps["flowProps"]>({
    flow: helloWorldExample.flow,
    resolvedFlow: helloWorldExample.resolvedFlow,
    inputs: inputs.current,
    output: result.current,
  });


  const prefixComponent = <button className='button button--success' onClick={() => inputs.current.__trigger.subject.next("run")}>Run!</button>;

  return (
    <PlaygroundTemplate meta={META_DATA} flowProps={flowProps} hideDelay={true} prefixComponent={prefixComponent} initWidth={300} extraInfo={extraInfo}>
      <OutputLogs output={result.current}/>
      
    </PlaygroundTemplate>
  );
}
