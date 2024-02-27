import { SidePane } from "./SidePane";
import React, { useState } from "react";
import { Timestamp } from "../Utils/Timestamp";
import { DynamicNodeInput, FlydeFlow, NodeInputs } from "@flyde/core";
import { RuntimeControlsProps } from "../RuntimeControls";
import { RuntimeStatus } from "@/lib/executeApp/executeApp";
import { InfoTooltip } from "../InfoToolip";

export interface InputsPaneProps {
  flow: FlydeFlow | null;
  inputs: Record<string, DynamicNodeInput>;
  status: RuntimeStatus;
}

export function InputsPane(props: InputsPaneProps) {
  const { flow, inputs } = props;

  const [values, setValues] = useState(new Map<string, string>());

  function setValue(key: string, value: string) {
    setValues((vals) => new Map(vals.set(key, value)));
  }

  function emit(key: string) {
    const value = values.get(key);
    if (typeof value === "string") {
      if (inputs[key]) {
        console.log("emitting", key, value);
        inputs[key].subject.next(value);
      } else {
        console.error("Could not find input", key);
      }
    } else {
      console.error("Could not find value for input", key);
    }
  }

  if (flow) {
    const inputs = Object.entries(flow.node.inputs)
      .map(([key, value]) => {
        return { key, ...value };
      })
      .sort((a, b) => (a.mode === "required" ? -1 : 1));

    return (
      <SidePane header={<span className="font-semibold">Inputs</span>}>
        <div className="px-4 py-4 ">
          <p className="text-slate-800">
            This flow has {inputs.length} main input
            {inputs.length === 1 ? "" : "s"}
            <InfoTooltip
              content="Main inputs act as external arguments to your flow. Use the controls
            below to emit values to them."
            />
          </p>
          {inputs.map((inp) => {
            return (
              <div
                key={inp.key}
                className="my-2 flex flex-row items-center gap-2 py-2"
              >
                <span className="text-base font-semibold w-24">{inp.key}</span>
                <input
                  className="border rounded px-2 py-1"
                  placeholder={"Enter value for " + inp.key}
                  value={values.get(inp.key) ?? ""}
                  onChange={(e) => setValue(inp.key, e.target.value)}
                />
                <button
                  className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded disabled:bg-gray-500`}
                  onClick={() => emit(inp.key)}
                  disabled={props.status.type === "stopped"}
                >
                  Emit
                </button>
              </div>
            );
          })}
          {inputs.length > 0 ? (
            <div className="mt-4 italic text-slate-800">
              App must be running for inputs to be emitted.
            </div>
          ) : null}
        </div>
      </SidePane>
    );
  } else {
    return (
      <SidePane header={<span className="font-semibold">Inputs</span>}>
        <div className="p-2">
          Could not find main flow. Make sure your index.ts file has a single
          &quot;loadFlow&quot; with an existing Flyde file.
        </div>
      </SidePane>
    );
  }
}
