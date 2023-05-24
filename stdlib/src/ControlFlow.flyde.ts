import { CodePart } from "@flyde/core";

const PubSub = require("pubsub-js");

const namespace = "Control Flow";

export const LimitTimes: CodePart = {
  id: "Limit Times",
  namespace,
  description: "Item will be emitted until the limit is reached",
  inputs: {
    item: { mode: "required", description: "The item to emit" },
    times: {
      mode: "required",
      description: "The number of times to emit the item",
    },
    reset: { mode: "optional", description: "Reset the counter" },
  },
  outputs: { ok: {} },
  reactiveInputs: ["item", "reset"],
  completionOutputs: [],
  run: function (inputs, outputs, adv) {
    // magic here
    const { state } = adv;
    const { item, times, reset } = inputs;
    const { ok } = outputs;

    if (typeof reset !== "undefined") {
      state.set("val", 0);
      return;
    }

    let curr = state.get("val") || 0;
    curr++;
    state.set("val", curr);
    if (curr >= times) {
      adv.onError(new Error(`Limit of ${times} reached`));
    } else {
      ok.next(item);
    }
  },
};

export const RoundRobin3: CodePart = {
  id: "Round Robin 3",
  namespace,
  description:
    "Item will be emitted to one of the three outputs in a round robin fashion",
  inputs: { value: { mode: "required", description: "The value to emit" } },
  outputs: {
    r1: {
      description:
        'The first output in order to emit the value received. After emitting a value, it moves to "r2"\'s turn.',
    },
    r2: {
      description:
        'The second output in order to emit the value received. After emitting a value, it moves to "r3"\'s turn.',
    },
    r3: {
      description:
        'The third output in order to emit the value received. After emitting a value, it moves back to "r1"\'s turn.',
    },
  },
  completionOutputs: [],
  reactiveInputs: ["value"],
  run: function (inputs, outputs, adv) {
    const { state } = adv;
    const { r1, r2, r3 } = outputs;
    const curr = state.get("curr") || 0;

    const o = [r1, r2, r3][curr];

    const nextCurr = (curr + 1) % 3;

    o.next(inputs.item);
    state.set("curr", nextCurr);
  },
};

export const RoundRobin2: CodePart = {
  namespace,
  id: "Round Robin 2",
  description:
    "Item will be emitted to one of the 2 outputs in a round robin fashion",
  inputs: { value: { mode: "required", description: "The value to emit" } },
  outputs: {
    r1: {
      description:
        'The first output in order to emit the value received. After emitting a value, it moves to "r2"\'s turn.',
    },
    r2: {
      description:
        'The second output in order to emit the value received. After emitting a value, it moves to "r3"\'s turn.',
    },
  },
  completionOutputs: [],
  reactiveInputs: ["value"],
  run: function (inputs, outputs, adv) {
    const { state } = adv;
    const { r1, r2 } = outputs;
    const curr = state.get("curr") || 0;

    const o = [r1, r2][curr];

    const nextCurr = (curr + 1) % 2;

    o.next(inputs.item);
    state.set("curr", nextCurr);
  },
};

export const RoundRobin4: CodePart = {
  id: "Round Robin 4",
  namespace,
  description:
    "Item will be emitted to one of the 4 outputs in a round robin fashion",
  inputs: { value: { mode: "required", description: "The value to emit" } },
  outputs: {
    r1: {
      description:
        'The first output in order to emit the value received. After emitting a value, it moves to "r2"\'s turn.',
    },
    r2: {
      description:
        'The second output in order to emit the value received. After emitting a value, it moves to "r3"\'s turn.',
    },
    r3: {
      description:
        'The third output in order to emit the value received. After emitting a value, it moves to "r4"\'s turn.',
    },
    r4: {
      description:
        'The fourth output in order to emit the value received. After emitting a value, it moves back to "r1"\'s turn.',
    },
  },
  completionOutputs: [],
  reactiveInputs: ["value"],
  run: function (inputs, outputs, adv) {
    const { state } = adv;
    const { r1, r2, r3, r4 } = outputs;
    const curr = state.get("curr") || 0;

    const o = [r1, r2, r3, r4][curr];

    const nextCurr = (curr + 1) % 4;

    o.next(inputs.item);
    state.set("curr", nextCurr);
  },
};

export const Publish: CodePart = {
  id: "Publish",
  namespace,
  description:
    "Publishes a value by a key to all listeners in the current flow. Use 'Subscribe' to listen to events.",
  inputs: {
    key: {
      mode: "required",
      description: "A key to use to subscribe to values",
    },
    value: { mode: "required" },
  },
  outputs: {},
  run: function (inputs, _, adv) {
    // magic here
    const nsKey = `${adv.ancestorsInsIds}__${inputs.key}`;

    PubSub.publish(nsKey, inputs.value);
  },
};

export const Subscribe: CodePart = {
  id: "Subscribe",
  namespace,
  description:
    "Subscribes to a value published by a key. Use 'Publish' to publish values.",
  inputs: {
    key: {
      mode: "required",
      description: "A key to use to subscribe to values",
    },
    initial: {
      mode: "required-if-connected",
      description: "If passed will be published has the first value",
    },
  },
  completionOutputs: [],
  outputs: { value: { description: "The value published by the key" } },
  run: function (inputs, outputs, adv) {
    const { value } = outputs;
    const nsKey = `${adv.ancestorsInsIds}__${inputs.key}`;
    const token = PubSub.subscribe(nsKey, (_, data) => {
      value.next(data);
    });

    if (typeof inputs.initial !== "undefined") {
      value.next(inputs.initial);
    }

    adv.onCleanup(() => {
      PubSub.unsubscribe(token);
    });
  },
};

export const BooleanSplit: CodePart = {
  namespace,
  id: "Boolean Split",
  description: "Splits a boolean value into two outputs",
  inputs: {
    value: { mode: "required", description: "Boolean value" },
    trueValue: {
      mode: "required-if-connected",
      description: "Value to emit if the input is true. Defaults to true",
    },
    falseValue: {
      mode: "required-if-connected",
      description: "Value to emit if the input is false. Defaults to false",
    },
  },
  outputs: {
    true: { description: "The value is true" },
    false: { description: "The value is false" },
  },
  run: function (inputs, outputs) {
    const { true: trueOutput, false: falseOutput } = outputs;
    const { value, trueValue, falseValue } = inputs;
    if (value) {
      trueOutput.next(trueValue ?? true);
    } else {
      falseOutput.next(falseValue ?? false);
    }
  },
};

export const EmitOnTrigger: CodePart = {
  namespace,
  id: "Emit on Trigger",
  description: "Emits the value when the trigger input receives any value",
  inputs: {
    value: { mode: "required", description: "The value to emit" },
    trigger: { mode: "required", description: "The trigger to emit the value" },
  },
  outputs: {
    result: { description: "The value emitted" },
  },
  run: function (inputs, outputs) {
    const { result } = outputs;
    const { value, trigger } = inputs;
    if (trigger !== undefined) {
      result.next(value);
    }
  },
};

export const Switch3: CodePart = {
  namespace,
  id: "Switch 3",
  description:
    "Switches between 3 outputs based on the input value. If the value is not equal to any of the cases, the default output is used.",
  inputs: {
    value: { mode: "required", description: "The value to switch on" },
    firstCase: {
      mode: "required",
      description: "The value to switch on for the first output",
    },
    secondCase: {
      mode: "required",
      description: "The value to switch on for the second output",
    },
    thirdCase: {
      mode: "required",
      description: "The value to switch on for the third output",
    },
    outputValue: {
      mode: "required-if-connected",
      description: "The value to emit on the output. Defaults to 'value'",
    },
  },
  outputs: {
    first: {
      description:
        "The value emitted if the input value is equal to the first case",
    },
    second: {
      description:
        "The value emitted if the input value is equal to the second case",
    },
    third: {
      description:
        "The value emitted if the input value is equal to the third case",
    },
    default: {
      description:
        "The value emitted if the input value is not equal to any of the cases",
    },
  },
  run: function (inputs, outputs) {
    const {
      first,
      second,
      third,
      default: defaultOutput,
      outputValue,
    } = outputs;
    const { value, firstCase, secondCase, thirdCase } = inputs;
    if (value === firstCase) {
      first.next(outputValue ?? value);
    } else if (value === secondCase) {
      second.next(outputValue ?? value);
    } else if (value === thirdCase) {
      third.next(outputValue ?? value);
    } else {
      defaultOutput.next(outputValue ?? value);
    }
  },
};

export const Switch2: CodePart = {
  id: "Switch 2",
  description:
    "Switches between 2 outputs based on the input value. If the value is not equal to any of the cases, the default output is used.",
  namespace,
  inputs: {
    value: { mode: "required", description: "The value to switch on" },
    firstCase: {
      mode: "required",
      description: "The value to switch on for the first output",
    },
    secondCase: {
      mode: "required",
      description: "The value to switch on for the second output",
    },
    outputValue: {
      mode: "required-if-connected",
      description: "The value to emit on the output. Defaults to 'value'",
    },
  },
  outputs: {
    first: {
      description:
        "The value emitted if the input value is equal to the first case",
    },
    second: {
      description:
        "The value emitted if the input value is equal to the second case",
    },
    default: {
      description:
        "The value emitted if the input value is not equal to any of the cases",
    },
  },
  run: function (inputs, outputs) {
    const { first, second, default: defaultOutput, outputValue } = outputs;
    const { value, firstCase, secondCase } = inputs;
    if (value === firstCase) {
      first.next(outputValue ?? value);
    } else if (value === secondCase) {
      second.next(outputValue ?? value);
    } else {
      defaultOutput.next(outputValue ?? value);
    }
  },
};

export const Switch4: CodePart = {
  id: "Switch 4",
  description:
    "Switches between 4 outputs based on the input value. If the value is not equal to any of the cases, the default output is used.",
  namespace,
  inputs: {
    value: { mode: "required", description: "The value to switch on" },
    firstCase: {
      mode: "required",
      description: "The value to switch on for the first output",
    },
    secondCase: {
      mode: "required",
      description: "The value to switch on for the second output",
    },
    thirdCase: {
      mode: "required",
      description: "The value to switch on for the third output",
    },
    fourthCase: {
      mode: "required",
      description: "The value to switch on for the fourth output",
    },
    outputValue: {
      mode: "required-if-connected",
      description: "The value to emit on the output. Defaults to 'value'",
    },
  },
  outputs: {
    first: {
      description:
        "The value emitted if the input value is equal to the first case",
    },
    second: {
      description:
        "The value emitted if the input value is equal to the second case",
    },
    third: {
      description:
        "The value emitted if the input value is equal to the third case",
    },
    fourth: {
      description:
        "The value emitted if the input value is equal to the fourth case",
    },
    default: {
      description:
        "The value emitted if the input value is not equal to any of the cases",
    },
  },
  run: function (inputs, outputs) {
    const {
      first,
      second,
      third,
      fourth,
      default: defaultOutput,
      outputValue,
    } = outputs;
    const { value, firstCase, secondCase, thirdCase, fourthCase } = inputs;
    if (value === firstCase) {
      first.next(outputValue ?? value);
    } else if (value === secondCase) {
      second.next(outputValue ?? value);
    } else if (value === thirdCase) {
      third.next(outputValue ?? value);
    } else if (value === fourthCase) {
      fourth.next(outputValue ?? value);
    } else {
      defaultOutput.next(outputValue ?? value);
    }
  },
};

export const Delay: CodePart = {
  id: "Delay",
  defaultStyle: {
    icon: "fa-clock",
  },
  searchKeywords: ["timeout", "wait", "setTimeout"],
  namespace,
  description: "Delays a value",
  inputs: {
    value: { description: "Value to delay" },
    delay: { description: "Delay in milliseconds" },
  },
  outputs: {
    delayedValue: { description: "Delayed value" },
  },
  run: async ({ value, delay }, { delayedValue }) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    delayedValue.next(value);
  },
};

export const Interval: CodePart = {
  id: "Interval",
  namespace,
  defaultStyle: {
    icon: "fa-clock",
  },
  description: "Emits a value every interval",
  inputs: {
    value: { description: "Value to emit" },
    interval: { description: "Interval in milliseconds" },
  },
  reactiveInputs: ["value", "interval"],
  outputs: {
    value: { description: "Emitted value" },
  },
  completionOutputs: [],
  run: (inputs, outputs, adv) => {
    if (adv.state.get("timer")) {
      clearInterval(adv.state.get("timer"));
    }

    const timer = setInterval(() => {
      outputs.value.next(inputs.value);
    }, inputs.interval);

    adv.state.set("timer", timer);

    adv.onCleanup(() => {
      clearInterval(timer);
    });
  },
};

export const Debounce: CodePart = {
  id: "Debounce",
  namespace,
  inputs: {
    value: {
      mode: "required",
      description: "The data that needs to be debounced",
    },
    wait: {
      mode: "required",
      defaultValue: 250,
      description: "Time (in millis) to wait until 'value' is emitted",
    },
  },
  outputs: { result: { description: "The debounced value" } },
  completionOutputs: ["result"],
  reactiveInputs: ["value"],
  description:
    'Emits the last value received after being idle for "wait" amount of milliseconds',
  run: function (inputs, outputs, adv) {
    const { value, wait } = inputs;
    const { result } = outputs;

    const timer = adv.state.get("timer");
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      result.next(value);
    }, wait);

    adv.state.set("timer", newTimer);

    adv.onCleanup(() => {
      clearTimeout(timer);
    });
  },
};

export class ThrottleError extends Error {
  value: any;
  constructor(value: any) {
    super("Throttle: Value dropped");
    this.value = value;
  }
}

export const Throttle: CodePart = {
  id: "Throttle",
  namespace,
  inputs: {
    value: {
      mode: "required",
      description: "The data that needs to be throttled",
    },
    wait: {
      mode: "required",
      defaultValue: 250,
      description: "Time (in millis) to wait until 'value' is emitted",
    },
  },
  outputs: { result: { description: "The throttled value" } },
  completionOutputs: ["result"],
  reactiveInputs: ["value"],
  description:
    'Emits the first value received after being idle for "wait" amount of milliseconds',
  run: function (inputs, outputs, adv) {
    const { value, wait } = inputs;
    const { result } = outputs;

    const timer = adv.state.get("timer");
    if (timer) {
      adv.onError(new ThrottleError(value));
      return;
    } else {
      result.next(value);
      const newTimer = setTimeout(() => {
        adv.state.set("timer", null);
      }, wait);
      adv.state.set("timer", newTimer);
    }
  },
};

export const EqualsBoolean: CodePart = {
  id: "Equals (Bool)",
  defaultStyle: {
    icon: "fa-equals",
  },
  namespace,
  description:
    "Emits true if two values are equal (=== equality). Otherwise emits false.",
  inputs: {
    a: { description: "First value" },
    b: { description: "Second value" },
  },
  outputs: { result: { description: "true if a is equal to b" } },
  run: ({ a, b }, { result }) => result.next(a === b),
};

export const Equals: CodePart = {
  id: "Equals",
  namespace,
  description:
    'Emits the value of "a" to output "true" if "a" is equal to "b". Otherwise emits the value of "a" to output "false".',
  inputs: {
    a: {
      mode: "required",
      description: "First value",
    },
    b: {
      mode: "required",
      description: "Second value",
    },
  },
  outputs: {
    true: {
      description: "Emits the value of a if a is equal to b",
    },
    false: {
      description: "Emits the value of a if a is not equal to b",
    },
  },
  run: (inputs, outputs) => {
    const { a, b } = inputs;
    const { true: trueOutput, false: falseOutput } = outputs;

    if (a === b) {
      trueOutput.next(a);
    } else {
      falseOutput.next(a);
    }
  },
};
