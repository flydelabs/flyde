import React, { Fragment, useEffect, useRef, useState } from "react";
import { produce } from "immer";

import "@flyde/flow-editor/src/index.scss";
import "./style.scss";

import {
  dynamicOutput,
  dynamicNodeInput,
  isVisualNode,
  isRefNodeInstance,
  NodesDefCollection,
  staticInputPinConfig,
} from "@site/../core/dist";

import {
  PlaygroundTemplate,
  PlaygroundTemplateProps,
} from "./_PlaygroundTemplate/PlaygroundTemplate";

import example from "./_flows/debounce-throttle.flyde";
import { OutputLogs } from "./_OutputLogs/OutputLogs";

console.log({ example });

const META_DATA = {
  title: "Debounce vs. Throttling",
  description: `This example takes Flyde's visual feedback to the next level by showing the difference between debouncing and throttling. Click on the buttons below to emit some Emojis.`,
  key: "debounce-throttling",
};

const extraInfo = `Cool right? you can try duplicating parts by pressing shift+D. Connect parts together by clicking on the source part's output pin and then on a the targets part's input pin`;

export default function DebounceThrottlingExample(): JSX.Element {
  const result = useRef(dynamicOutput());

  const inputs = useRef({
    input: dynamicNodeInput(),
  });

  const [deb, setDeb] = useState(1500);
  const [thr, setThr] = useState(4000);

  const [flowProps, setFlowProps] = useState<
    PlaygroundTemplateProps["flowProps"]
  >({
    flow: example.flow,
    dependencies: example.dependencies,
    inputs: inputs.current,
    output: result.current,
  });

  useEffect(() => {
    setFlowProps(
      produce(flowProps, (draft) => {
        const part = draft.flow.part;
        if (isVisualNode(part)) {
          const debIns = part.instances.find(
            (ins) => isRefNodeInstance(ins) && ins.partId === "Debounce"
          );
          debIns.inputConfig.wait = staticInputPinConfig(deb);
          const thrIns = part.instances.find(
            (ins) => isRefNodeInstance(ins) && ins.partId === "Throttle"
          );
          thrIns.inputConfig.wait = staticInputPinConfig(thr);
        }
      })
    );
  }, [deb, thr]);

  useEffect(() => {
    result.current.subscribe((d) => {
      // setLog((l) => [...l, d]);
    });
  }, []);

  const controls = (
    <Fragment>
      <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
        <input
          type="range"
          id="deb"
          name="deb"
          value={deb}
          step="100"
          min="0"
          max="7500"
          onChange={(e) => setDeb(Number(e.target.value))}
        />
        <label htmlFor="deb">Debounce - {deb}ms</label>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
        <input
          type="range"
          id="thr"
          name="thr"
          value={thr}
          step="100"
          min="0"
          max="7500"
          onChange={(e) => setThr(Number(e.target.value))}
        />
        <label htmlFor="thr">Throttle - {thr}ms</label>
      </div>

      <button
        className="emit-btn button button--outline button--primary"
        onClick={() => inputs.current.input.subject.next("🐶")}
      >
        Emit 🐶
      </button>
      <button
        className="emit-btn button button--outline button--primary"
        onClick={() => inputs.current.input.subject.next("😸")}
      >
        Emit 😸
      </button>
      <button
        className="emit-btn button button--outline button--primary"
        onClick={() => inputs.current.input.subject.next("🦄")}
      >
        Emit 🦄
      </button>
    </Fragment>
  );

  return (
    <PlaygroundTemplate
      meta={META_DATA}
      flowProps={flowProps}
      prefixComponent={controls}
      hideDelay={true}
      extraInfo={extraInfo}
    >
      <OutputLogs output={result.current} />
    </PlaygroundTemplate>
  );
}
