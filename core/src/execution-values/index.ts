import {
  isQueueInputPinConfig,
  isStickyInputPinConfig,
  Node,
  NodeInput,
  NodeInputs,
  NodeState,
} from "../node";

import { containsAll, entries, isDefined, keys } from "../common";
import { TRIGGER_PIN_ID } from "../connect";

export const peekValueForExecution = (
  key: string,
  input: NodeInput,
  state: NodeState,
  nodeId: string
) => {
  const stateItem = state.get(key);
  let val;
  if (!input) {
    throw new Error(
      `Trying to peek value of inexsting input in key "${key}" in node "${nodeId}"`
    );
  }
  if (isQueueInputPinConfig(input.config)) {
    val = stateItem ? [...stateItem].shift() : undefined;
  } else {
    val = stateItem;
  }

  return val;
};

export const pullValueForExecution = (
  key: string,
  input: NodeInput,
  state: NodeState
): unknown => {
  const stateItem = state.get(key);
  let val;

  if (isQueueInputPinConfig(input.config)) {
    val = (stateItem || []).shift();
    state.set(key, stateItem);
  } else {
    val = stateItem;

    if (!isStickyInputPinConfig(input.config)) {
      state.delete(key);
    }
  }

  return val;
};

export const pullValuesForExecution = (
  nodeInputs: NodeInputs,
  state: NodeState
) => {
  const data = entries(nodeInputs).reduce<Record<string, unknown>>(
    (acc, [key, input]) => {
      acc[key] = pullValueForExecution(key, input, state);
      return acc;
    },
    {}
  );

  return data;
};

export const peekValuesForExecution = (
  nodeInputs: NodeInputs,
  state: NodeState,
  nodeId: string
) => {
  const data = entries(nodeInputs).reduce<Record<string, unknown>>(
    (acc, [key, input]) => {
      acc[key] = peekValueForExecution(key, input, state, nodeId);
      return acc;
    },
    {}
  );

  return data;
};

export const hasNewSignificantValues = (
  nodeInputs: NodeInputs,
  state: NodeState,
  nodeId: string
) => {
  return entries(nodeInputs).some(([k, i]) => {
    const isQueue = isQueueInputPinConfig(i.config);
    const value = peekValueForExecution(k, i, state, nodeId);

    return isDefined(value) && isQueue;
  });
};

export const isNodeStateValid = (
  nodeInputs: NodeInputs,
  state: NodeState,
  node: Node
) => {
  const connectedKeys = keys(nodeInputs);

  const requiredInputs = keys(node.inputs).filter((k) => {
    const mode = node.inputs[k]?.mode;
    return !mode || mode === "required";
  });

  if (connectedKeys.includes(TRIGGER_PIN_ID)) {
    requiredInputs.push(TRIGGER_PIN_ID);
  }

  const hasAllRequired = containsAll(connectedKeys, requiredInputs);

  if (!hasAllRequired) {
    return false;
  }

  return (
    entries(nodeInputs)
      .filter(([key]) => !!node.inputs[key] || key === TRIGGER_PIN_ID) // filter irrelevant inputs
      // .filter(([key]) => !node.reactiveInputs?.includes(key))
      .every(([key, input]) => {
        const stateItem = state.get(key);

        const mode = node.inputs[key]?.mode || "required";

        if (mode === "optional") {
          return true;
        }

        if (isQueueInputPinConfig(input.config)) {
          return isDefined(stateItem) && stateItem.length > 0;
        } else {
          return isDefined(stateItem);
        }
      })
  );
};

export const subscribeInputsToState = (
  nodeInputs: NodeInputs,
  state: NodeState,
  onInput: (key: string, val: unknown) => void
) => {
  const cleanups: Function[] = [];

  entries(nodeInputs).forEach(([key, arg]) => {
    if (!arg) {
      // means the node is optional and was not given
      return;
    }

    const subscription = arg.subject.subscribe((val) => {
      if (isQueueInputPinConfig(arg.config)) {
        const queue = state.get(key) || [];

        if (!Array.isArray(queue)) {
          throw new Error(
            `impossible state - state of key ${key} is set but not an array`
          );
        }
        queue.push(val);
        state.set(key, queue);
        onInput(key, val);
      } else {
        state.set(key, val);
        onInput(key, val);
      }
    });

    cleanups.push(() => subscription.unsubscribe());
  });

  return () => cleanups.forEach((cln) => cln());
};
