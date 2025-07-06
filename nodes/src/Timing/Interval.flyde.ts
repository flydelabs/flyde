import { TIMING_NAMESPACE } from "./common";
import { CodeNode } from "@flyde/core";

const namespace = TIMING_NAMESPACE;

export const Interval: CodeNode = {
  id: "Interval",
  namespace,
  menuDisplayName: "Interval",
  icon: "stopwatch",
  menuDescription: "Emits a value every interval",
  description: "Emits a value every interval",
  displayName: "Emits {{value}} every {{time}}ms",
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
