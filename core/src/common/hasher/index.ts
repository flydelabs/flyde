import _md5 from "md5";
import { FlydeFlow } from "../../flow-schema";
import { isInlineValueNode, isVisualNode, Node } from "../../node";

const md5 = (str: string) => {
  return _md5(str);
};

export const hashNode = (node: Node, ignorePos = true) => {
  const { id, completionOutputs, reactiveInputs, inputs, outputs } = node;

  const baseNode = { id, completionOutputs, reactiveInputs, inputs, outputs };

  if (isVisualNode(node)) {
    const { instances, connections, inputsPosition, outputsPosition } = node;
    // const cleanedInstances = ignorePos ? instances.map((ins) => {
    //     const { pos, ...rest } = ins;
    //     return rest;
    // }) : instances;

    const instancesWithoutPos = instances.map((ins) => {
      const { pos, ...rest } = ins;
      return rest;
    });

    const maybeIoPos = ignorePos ? {} : { inputsPosition, outputsPosition };

    // const cleanedInstances = ignorePos
    const instancesToUse = ignorePos ? instancesWithoutPos : instances;
    instancesToUse.sort((a, b) => a.id.localeCompare(b.id));

    const conns = [...connections];
    conns.sort((a, b) => {
      const s1 = `${a.from.insId}.${a.from.pinId}`;
      const s2 = `${b.from.insId}.${b.from.pinId}`;
      return s1.localeCompare(s2);
    });

    const str = JSON.stringify({
      instancesToUse,
      conns,
      ...baseNode,
      maybeIoPos,
    });
    return md5(str);
  } else if (isInlineValueNode(node)) {
    const { customViewCode } = node;
    const fnCode = node.fnCode ?? node.runFnRawCode;
    const str = JSON.stringify({ fnCode, customViewCode, ...baseNode });
    return md5(str);
  }
  throw new Error(`Hashing code nodes unsupported`);
};

export const hashFlow = (flow: FlydeFlow) => {
  const { node, imports } = flow;

  const nodeHash = hashNode(node, false);

  const orderedImports = Object.entries(imports ?? {})
    .sort(([k1], [k2]) => k1.localeCompare(k2))
    .map(([k, v]) => [k, v.sort()] as [string, string[]])
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  const rest = JSON.stringify(orderedImports);

  return md5(nodeHash + rest);
};
