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
import { OutputLogs } from "./_OutputLogs/OutputLogs";

const META_DATA = {
  title: "Fibonacci Sequence",
  description: `This example showcases a classical recursion - the Fibonacci sequence. On numbers higher than 1, the "Fibonacci" part calls itself recursively!`,
  key: "fibo",
  extraInfo: 'Cool right? everything is editable, so try changing the algorithm and see how it affects the end result!'
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
    flow: fiboFlow.flow,
    resolvedFlow: fiboFlow.resolvedFlow,
    inputs: inputs.current,
    output: result.current,
  });

  const onCalc = useCallback((val: number) => () => {

    if (val === -1 ) {
      val = Number(prompt('N?'))
      if (isNaN(val) || val < 0) {
        alert('Invalid input. Please try again using a positive integer')
        return;
      }
    }
    if (
      val <= 8 ||
      confirm(
        `This is an unoptimized Fib. calculator and larger numbers might take a long time to calculate. Are you sure?`
      )
    ) {
      inputs.current.n.subject.next(val);
    }
  }, [val]);

  const controls = (
    <div>
          <button className='fib-btn button button--outline button--primary button-sm' onClick={onCalc(0)}>Calc Fib(0)</button>
          <button className='fib-btn button button--outline button--primary button-sm' onClick={onCalc(1)}>Calc Fib(1)</button>
          <button className='fib-btn button button--outline button--primary button-sm' onClick={onCalc(3)}>Calc Fib(3)</button>
          <button className='fib-btn button button--outline button--primary button-sm' onClick={onCalc(5)}>Calc Fib(5)</button>
          <button className='fib-btn button button--outline button--primary button-sm' onClick={onCalc(-1)}>Calc Fib(N)</button>
    </div>
  );

  return (
    <PlaygroundTemplate meta={META_DATA} flowProps={flowProps} defaultDelay={100} prefixComponent={controls}>

      <OutputLogs output={result.current}/>
      
    </PlaygroundTemplate>
  );
}
