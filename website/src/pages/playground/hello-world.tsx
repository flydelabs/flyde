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
  description: `This is the "Hello, World!" example for Flyde. When you run this flow, it will output "Hello", wait for 3 seconds, and then output "World!". Click the "Run" button below to see it in action. This example highlights one of the key strengths of Flyde: the ability to view your program running in real-time. Note that the delay in the flow is intentional and added to make the example longer.`,
  key: "hello-world",
};

const extraInfo =
  'Great job. You can change the strings  double-clicking them. Double click on the green "ms: 3000" to edit the delay threshold. Go ahead, try it now!';

export default function Home(): JSX.Element {
  const result = useRef(dynamicOutput());

  const inputs = useRef({
    __trigger: dynamicPartInput(),
  });

  const [flowProps, setFlowProps] = useState<
    PlaygroundTemplateProps["flowProps"]
  >({
    flow: helloWorldExample.flow,
    dependencies: helloWorldExample.dependencies,
    inputs: inputs.current,
    output: result.current,
  });

  const prefixComponent = (
    <button
      className="button button--success"
      onClick={() => inputs.current.__trigger.subject.next("run")}
    >
      Run!
    </button>
  );

  return (
    <PlaygroundTemplate
      meta={META_DATA}
      flowProps={flowProps}
      hideDelay={true}
      prefixComponent={prefixComponent}
      initWidth={300}
      extraInfo={extraInfo}
    >
      <OutputLogs output={result.current} />
    </PlaygroundTemplate>
  );
}
