import {
  isInlineNodeInstance,
  isMacroNodeInstance,
  macroConfigurableValue,
} from "@flyde/core";
import { ConditionType } from "@flyde/stdlib/dist/ControlFlow/Conditional/ConditionType";

export function migrateMacroNodeV2(data: { node?: any; imports?: any }) {
  const skippedMacros = [
    "Collect",
    "CodeExpression",
    "Switch",
    "Comment",
    "Note",
  ];

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
          if (ins.macroId === "Conditional") {
            ins.macroData.leftOperand = macroConfigurableValue("string", "");
            ins.macroData.rightOperand = macroConfigurableValue("string", "");
            ins.macroData.condition.type = ConditionType.Equal;
          } else {
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
            } else if (mode === "dynamic") {
              ins.macroData[key] = macroConfigurableValue("dynamic", undefined);
            }
          }
        }
      }
    } else if (isInlineNodeInstance(ins)) {
      migrateMacroNodeV2({ node: ins.node });
    }
  }
}
