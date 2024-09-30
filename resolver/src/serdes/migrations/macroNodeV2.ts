import { isMacroNodeInstance, macroConfigurableValue } from "@flyde/core";

export function migrateMacroNodeV2(data: { node?: any; imports?: any }) {
  const skippedMacros = ["Collect"];

  // migrate old stdlib nodes
  for (const ins of data.node?.instances) {
    if (isMacroNodeInstance(ins)) {
      if (skippedMacros.includes(ins.macroId)) {
        continue;
      }
      for (const key in ins.macroData) {
        const value = ins.macroData[key];
        const isOld = value && !value.type;
        if (isOld) {
          const mode = value.mode ?? "static";
          const oldValue = value.value ?? value;
          if (mode === "static") {
            const newType =
              typeof oldValue === "object"
                ? "json"
                : typeof oldValue === "number"
                ? "number"
                : typeof oldValue === "boolean"
                ? "boolean"
                : "string";
            ins.macroData[key] = macroConfigurableValue(newType, oldValue);
          } else if (value.mode === "dynamic") {
            ins.macroData[key] = macroConfigurableValue("dynamic", undefined);
          }
        }
      }
    }
  }
}
