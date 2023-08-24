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
    return loadingDef;
  }
};
