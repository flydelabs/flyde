import { TIMING_NAMESPACE } from "./common";
import {
  ImprovedMacroNode2,
  improvedMacro2ToOldMacro,
} from "../ImprovedMacros/improvedMacros2";

const namespace = TIMING_NAMESPACE;

const interval: ImprovedMacroNode2 = {
  id: "Interval",
  namespace,
  menuDisplayName: "Interval",
  icon: "stopwatch",
  menuDescription: "Emits a value every interval",
  description: "Emits a value every interval",
  inputs: {
    value: {
      description: "Value to emit (supports templates)",
      editorType: "json",
    },
    time: {
      defaultValue: 1000,
      description: "Interval",
      editorType: "number",
    },
  },
  outputs: {
    value: { description: "Emitted value" },
  },
  completionOutputs: [],
  run: (inputs, outputs, adv) => {
    const { time, value } = inputs;

    const existingTimer = adv.state.get("timer");
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const timer = setInterval(() => {
      outputs.value.next(value);
    }, time);

    adv.state.set("timer", timer);

    adv.onCleanup(() => {
      clearInterval(timer);
    });
  },
};

export const Interval = improvedMacro2ToOldMacro(interval);
