import { spy } from "sinon";
import Sinon = require("sinon");
import {
  BaseNode,
  InputPinMap,
  VisualNode,
  InternalCodeNode,
  NodeInstance,
} from "./.";

import {
  DynamicOutput,
  dynamicOutput,
  InputMode,
  OutputPinMap,
  nodeInput,
  nodeOutput,
} from "./node";

import { connectionNode, externalConnectionNode } from "./connect/helpers";

import { DebuggerEventType, DebuggerEvent, Debugger } from "./execute/debugger";
interface ConciseBaseNode extends Omit<BaseNode, "inputs" | "outputs" | "id"> {
  inputs?: string[];
  outputs?: string[];
  id?: string;
}

interface ConciseVisualNode extends ConciseBaseNode {
  connections: Array<[string, string]>;
  instances: NodeInstance[];
}

interface ConciseCodeNode extends ConciseBaseNode {
  run: InternalCodeNode["run"];
}
const conciseBaseNode = (concise: ConciseBaseNode): BaseNode => {
  return {
    id: "a-node",
    ...concise,
    inputs: (concise.inputs || []).reduce<InputPinMap>((prev, curr) => {
      const [clean, mode] = curr.split("|");
      if (
        mode &&
        !["required", "required-if-connected", "optional"].includes(mode)
      ) {
        throw new Error(`Bad mode ${mode} in concise node`);
      }
      if (!clean) {
        throw new Error(`Bad input ${curr} in concise node`);
      }

      return { ...prev, [clean]: nodeInput(mode as InputMode) };
    }, {}),
    outputs: (concise.outputs || []).reduce<OutputPinMap>((prev, curr) => {
      const clean = curr.replace("?", "");
      return { ...prev, [clean]: nodeOutput(clean !== curr) };
    }, {}),
  };
};

export const conciseNode = (concise: ConciseVisualNode): VisualNode => {
  const base = conciseBaseNode(concise);

  return {
    ...base,
    connections: concise.connections.map(([from, to]) => {
      const [f1, f2] = from.split(".");
      const [t1, t2] = to.split(".");

      if (!f1) {
        throw new Error(`Bad source connection ${from} in concise node`);
      }

      if (!t1) {
        throw new Error(`Bad target connection ${to} in concise node`);
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

export const conciseCodeNode = (concise: ConciseCodeNode): InternalCodeNode => {
  const base = conciseBaseNode(concise);
  return {
    ...base,
    run: concise.run,
  };
};

export const valueNode = (id: string, value: any) =>
  conciseCodeNode({
    id,
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
