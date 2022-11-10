import * as _md5 from "md5";
import { FlydeFlow, isCodePart, isGroupedPart, Part, Project } from "../..";

const md5 = (str: string) => {
  return _md5(str);
};

export const hashPart = (part: Part, ignorePos = true) => {
  const { id, completionOutputs, reactiveInputs, inputs, outputs } = part;

  const basePart = { id, completionOutputs, reactiveInputs, inputs, outputs };

  if (isGroupedPart(part)) {
    const { instances, id, connections, inputsPosition, outputsPosition } = part;
    // const cleanedInstances = ignorePos ? instances.map((ins) => {
    //     const { pos, ...rest } = ins;
    //     return rest;
    // }) : instances;

    const instancesWithoutPos = instances.map((ins) => {
        const { pos, ...rest } = ins;
        return rest;
    });

    const maybeIoPos = ignorePos ? {} : {inputsPosition, outputsPosition};

    // const cleanedInstances = ignorePos 
    const instancesToUse = ignorePos ? instancesWithoutPos : instances;    
    instancesToUse.sort((a, b) => a.id.localeCompare(b.id));

    const conns = [...connections];
    conns.sort((a, b) => {
      const s1 = `${a.from.insId}.${a.from.pinId}`;
      const s2 = `${b.from.insId}.${b.from.pinId}`;
      return s1.localeCompare(s2);
    });

    const str = JSON.stringify({ id, instancesToUse, conns, ...basePart, maybeIoPos });
    return md5(str);
  } else if (isCodePart(part)) {
    const { fnCode, customViewCode } = part;
    const str = JSON.stringify({ fnCode, customViewCode, ...basePart });
    return md5(str);
  }
  throw new Error(`Hashing native parts unsupported`);
};

export const hashFlow = (flow: FlydeFlow, ignorePos = true) => {
  const { part, imports } = flow;

  const partHash = hashPart(part, false);

  const orderedImports = Object.entries(imports)
    .sort(([k1], [k2]) => k1.localeCompare(k2))
    .map(([k, v]) => [k, v.sort()] as [string, string[]])
    .reduce((acc, [k, v]) => ({...acc, [k]: v}), {})

  const rest = JSON.stringify(orderedImports);

  return md5(partHash + rest);
};
