import { Part, isVisualPart, isRefPartInstance, isInlinePartInstance, FlydeFlow } from "@flyde/core";

  const getPartIds = (part?: Part) => {
    if (part && isVisualPart(part)) {
      const refIds = part.instances.filter((ins: any) => isRefPartInstance(ins)).map((ins: any) => ins.partId);

      const innerIds = part.instances.filter((ins: any) => isInlinePartInstance(ins)).flatMap((ins: any) => getPartIds(ins.part));

      return [...refIds, ...innerIds];

    } else {
      return [];
    }
  }



export const cleanUnusedImports = (flow: FlydeFlow): FlydeFlow => {
    const importedPartIds = getPartIds(flow.part as Part)

    console.log({ importedPartIds });
    
  
    const imports = Object.fromEntries(Object.entries(flow.imports ?? {})
      .map(([key, val]) => {
  
        const ids = (typeof val === "string" ? [val] : val).filter((id) => {
          return importedPartIds.includes(id);
        });

      return [key, ids];
    }));

    return {part: flow.part, imports};
};
