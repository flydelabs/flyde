import * as _md5 from "md5";
import { isCodePart, isGroupedPart, Part, Project } from "../..";

const md5 = (str: string) => {
  return _md5(str);
};

export const hashPart = (part: Part) => {
  const { id, completionOutputs, reactiveInputs, inputs, outputs } = part;

  const basePart = { id, completionOutputs, reactiveInputs, inputs, outputs };

  if (isGroupedPart(part)) {
    const { instances, id, connections } = part;
    const cleanedInstances = instances.map((ins) => {
      const { pos, ...rest } = ins;
      return rest;
    });
    cleanedInstances.sort((a, b) => a.id.localeCompare(b.id));

    const conns = [...connections];
    conns.sort((a, b) => {
      const s1 = `${a.from.insId}.${a.from.pinId}`;
      const s2 = `${b.from.insId}.${b.from.pinId}`;
      return s1.localeCompare(s2);
    });

    const str = JSON.stringify({ id, cleanedInstances, conns, ...basePart });
    return md5(str);
  } else if (isCodePart(part)) {
    const { fnCode, customViewCode } = part;
    const str = JSON.stringify({ fnCode, customViewCode, ...basePart });
    return md5(str);
  }
  throw new Error(`Hashing native parts unsupported`);
};

export const hashProject = (project: Project) => {
  const { slug, id, customRepo, env, triggers } = project;

  const partsHashes = Object.values(customRepo).map(hashPart).join("");

  const rest = JSON.stringify({ id, slug, env, triggers });

  return md5(rest + partsHashes);
};
