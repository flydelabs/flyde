import { spy } from "sinon";
import Sinon = require("sinon");
import { BaseNode, InputPinMap, VisualNode, CodeNode, NodeInstance } from "./.";

import {
  DynamicOutput,
  dynamicOutput,
  InputMode,
  OutputPinMap,
  partInput,
  partOutput,
} from "./node";

import { connectionNode, externalConnectionNode } from "./connect";

import { DebuggerEventType, DebuggerEvent, Debugger } from "./execute/debugger";

export interface ConciseBasePart
  extends Omit<BaseNode, "inputs" | "outputs" | "id"> {
  inputs?: string[];
  outputs?: string[];
  id?: string;
}

export interface ConciseVisualPart extends ConciseBasePart {
  connections: Array<[string, string]>;
  instances: NodeInstance[];
}

export interface ConciseCodePart extends ConciseBasePart {
  run: CodeNode["run"];
}

export const conciseBasePart = (concise: ConciseBasePart): BaseNode => {
  return {
    id: "a-part",
    ...concise,
    inputs: (concise.inputs || []).reduce<InputPinMap>((prev, curr) => {
      const [clean, mode] = curr.split("|");
      if (
        mode &&
        !["required", "required-if-connected", "optional"].includes(mode)
      ) {
        throw new Error(`Bad mode ${mode} in concise part`);
      }
      if (!clean) {
        throw new Error(`Bad input ${curr} in concise part`);
      }

      return { ...prev, [clean]: partInput(mode as InputMode) };
    }, {}),
    outputs: (concise.outputs || []).reduce<OutputPinMap>((prev, curr) => {
      const clean = curr.replace("?", "");
      return { ...prev, [clean]: partOutput(clean !== curr) };
    }, {}),
  };
};

export const concisePart = (concise: ConciseVisualPart): VisualNode => {
  const base = conciseBasePart(concise);

  return {
    ...base,
    connections: concise.connections.map(([from, to]) => {
      const [f1, f2] = from.split(".");
      const [t1, t2] = to.split(".");

      if (!f1) {
        throw new Error(`Bad source connection ${from} in concise part`);
      }

      if (!t1) {
        throw new Error(`Bad target connection ${to} in concise part`);
      }

      return {
        from: f2 ? connectionNode(f1, f2) : externalConnectionNode(f1),
        to: t2 ? connectionNode(t1, t2) : externalConnectionNode(t1),
      };
    }),
    instances: concise.instances,
    inputsPosition: {},
    outputsPosition: {},
  };
};

export const conciseCodePart = (concise: ConciseCodePart): CodeNode => {
  const base = conciseBasePart(concise);
  return {
    ...base,
    run: concise.run,
  };
};

export const valuePart = (name: string, value: any) =>
  conciseCodePart({
    id: name,
    inputs: [],
    outputs: ["r"],
    run: (_, outputs) => outputs.r?.next(value),
  });

export const spiedOutput = (): [Sinon.SinonSpy, DynamicOutput] => {
  const s = spy();
  const d = dynamicOutput();
  d.subscribe(s);
  return [s, d];
};

export const callsFirstArgs = (s: Sinon.SinonSpy) => {
  return s.getCalls().map((c) => c.args[0]);
};

export const wrappedOnEvent = (
  type: DebuggerEventType,
  fn: Function
): Debugger["onEvent"] => {
  return (event: Omit<DebuggerEvent, "time" | "executionId">) => {
    if (event.type === type) {
      fn(event);
    }
  };
};
