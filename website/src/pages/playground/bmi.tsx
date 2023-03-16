import React, { useEffect, useRef, useState } from "react";
import { dynamicOutput, dynamicPartInput } from "@site/../core/dist";

import {
  PlaygroundTemplate,
  PlaygroundTemplateProps,
} from "./_PlaygroundTemplate/PlaygroundTemplate";

import "./style.scss";

// const bundled = require("./flows/hello-world.bundled.json");
import helloWorldExample from "./_flows/bmi.flyde";
import { OutputLogs } from "./_OutputLogs/OutputLogs";

const META_DATA = {
  title: "BMI Calculator",
  description: `Simple BMI calculator with a decision tree. There are many things that make sense done visually, and even more that don't. This example showcases Flyde's support for inline code. The BMI calculation uses a simple inline formula, and the final string uses a textual switch case. Flyde exposes dynamic arguments to your inline code automatically if you use the special "inputs." object!`,
  key: "bmi",
};

const extraInfo = "Try adding another prompt and another input to the formula!";

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
      className="button button--success "
      onClick={() => inputs.current.__trigger.subject.next("run")}
    >
      Run!
    </button>
  );

  return (
    <PlaygroundTemplate
      meta={META_DATA}
      flowProps={flowProps}
      prefixComponent={prefixComponent}
      initWidth={300}
      extraInfo={extraInfo}
      defaultDelay={500}
    >
      <OutputLogs output={result.current} />
    </PlaygroundTemplate>
  );
}
