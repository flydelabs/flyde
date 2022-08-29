import React, { useEffect, useRef, useState } from "react";
import {produce} from 'immer';

import "@flyde/flow-editor/src/index.scss";
import "./style.scss";

import { dynamicOutput, dynamicPartInput, isGroupedPart, PartDefRepo, staticInputPinConfig } from "@site/../core/dist";

import { PlaygroundTemplate, PlaygroundTemplateProps } from "./_PlaygroundTemplate/_PlaygroundTemplate";

import example from './flows/debounce-throttle.flyde';

const META_DATA = {
  title: "Debounce vs. Throttling",
  description: "This example takes Flyde's visual feeback to the next level by showing the difference between debounce and throttling. Click on the 'Trigger' button to emit a value to the Flyde flow. Try clicking multiple times and see how the debounce and throttling functions behave differently.",
  key: "debounce-throttling",
}

export default function DebounceThrottlingExample(): JSX.Element {

  const result = useRef(dynamicOutput());

  const inputs = useRef({
    click: dynamicPartInput()
  });

  const [log, setLog] = useState<string[]>([]);

  const [deb, setDeb] = useState(1500);
  const [thr, setThr] = useState(4000);

  const [flowProps, setFlowProps] = useState<PlaygroundTemplateProps['flowProps']>({ flow: {
    imports: {},
    exports: [],
    parts: example,
    mainId: 'Main'
  },
    resolvedFlow: example,
    inputs: inputs.current,
    output: result.current
  } );

  useEffect(() => {
    setFlowProps(produce(flowProps, draft => {
      for (const partId in draft.flow.parts) {
        const part = draft.flow.parts[partId];
        if (isGroupedPart(part)) {
          const debIns = part.instances.find(p => p.partId === 'Debounce');
          debIns.inputConfig.ms = staticInputPinConfig(deb);
          const thrIns = part.instances.find(p => p.partId === 'Throttle');
          thrIns.inputConfig.threshold = staticInputPinConfig(thr)
        }
      }
    }));
  } ,[deb, thr]);

  useEffect(() => {
    result.current.subscribe(d => {
      setLog(l => ([...l, d]));
    });
  }, []);

  return (
    <PlaygroundTemplate
      meta={META_DATA}
      flowProps={flowProps}
    > 
    <div>
        <input type="range" id="deb" name="deb"
        value={deb}
        step="100"
              min="0" max="7500" onChange={e => setDeb(Number(e.target.value))}/>
        <label htmlFor="deb">Debounce - {deb}ms</label>
    </div>
    <div>
        <input type="range" id="thr" name="thr"
        value={thr}
        step="100"
              min="0" max="7500" onChange={e => setThr(Number(e.target.value))}/>
        <label htmlFor="thr">Throttle - {thr}ms</label>
    </div>
      <button onClick={() => inputs.current.click.subject.next("🐶")}>Emit 🐶</button>
      <button onClick={() => inputs.current.click.subject.next("😸")}>Emit 😸</button>
      <button onClick={() => inputs.current.click.subject.next("🦄")}>Emit 🦄</button>
      <button onClick={() => setLog([])}>Clear</button>
      <code>
        {log.map((o, i) => (
          <div key={i}>{o}</div>
        ))}
      </code>
    </PlaygroundTemplate>
  );
}
