import { RefNodeInstance } from "@flyde/core";
import { NodeDefinition, getNodeDef } from "@flyde/core";

export const loadingDef: NodeDefinition = {
  id: "Loading",
  inputs: {},
  outputs: {},
};

export const safelyGetNodeDef: typeof getNodeDef = (idOrIns, resolved) => {
  try {
    return getNodeDef(idOrIns, resolved);
  } catch (e) {
    // console.error(e);
    const nodeId =
      typeof idOrIns === "string"
        ? idOrIns
        : (idOrIns as RefNodeInstance).nodeId;
    return {
      ...loadingDef,
      id: nodeId,
    };
  }
};
