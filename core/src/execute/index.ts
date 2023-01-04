import { noop, Subject } from "rxjs";
import { first } from "rxjs/operators";

export * from "./debugger";

import {
  isDynamicInput,
  dynamicPartInput,
  dynamicOutput,
  Part,
  getStaticValue,
  GroupedPart,
  isCodePart,
  isGroupedPart,
  NativePart,
  PartInput,
  PartInputs,
  PartOutputs,
  staticPartInput,
  PartAdvancedContext,
  isQueueInputPinConfig,
  PartState,
} from "../part";

import { connect, ERROR_PIN_ID } from "../connect";

import {
  hasNewSignificantValues,
  isPartStateValid,
  peekValueForExecution,
  pullValueForExecution,
  pullValuesForExecution,
  subscribeInputsToState,
} from "../execution-values";
import { delay, entries, isDefined, keys, OMap, OMapF } from "../common";
import { debugLogger } from "../common/debug-logger";
import {
  callFnOrFnPromise,
  codePartToNative,
  customRepoToPartRepo,
  isStaticInput,
  PartFn,
  PartRepo,
} from "..";
import { Debugger, DebuggerEventType } from "./debugger";

export type SubjectMap = OMapF<Subject<any>>;

export type ExecutionState = Map<string, any>;

export type CancelFn = () => void;

export type ExecuteNativeFn = (
  part: NativePart,
  args: PartInputs,
  outputs: PartOutputs,
  repo: PartRepo,
  _debugger: Debugger,
  insId: string
) => CancelFn;

export type ExecuteGroupFn = (
  part: GroupedPart,
  args: PartInputs,
  outputs: PartOutputs,
  _debugger: Debugger,
  indId: string
) => CancelFn;

export type ExecuteEnv = OMap<any>;

export type InnerExecuteFn = (
  part: Part,
  args: PartInputs,
  outputs: PartOutputs,
  insId: string
) => CancelFn;

export type NativeExecutionData = {
  part: NativePart;
  inputs: PartInputs;
  outputs: PartOutputs;
  repo: PartRepo;
  _debugger?: Debugger;
  insId: string;
  parentInsId?: string;
  extraContext?: Record<string, any>;
  mainState: OMap<PartState>;
  onError: (err: any) => void;
  onBubbleError: (err: any) => void;
  env: ExecuteEnv;
  onCompleted?: (data: any) => void;
};

export const INNER_STATE_SUFFIX = "_inner";
export const INPUTS_STATE_SUFFIX = "_inputs";

const executeNative = (data: NativeExecutionData) => {
  const {
    part,
    inputs,
    outputs,
    repo,
    _debugger,
    insId,
    parentInsId,
    mainState,
    onError,
    onCompleted,
    env,
    extraContext,
  } = data;
  const { fn } = part;

  const debug = debugLogger("core");

  const cleanUps: any = [];
  let partCleanupFn: ReturnType<PartFn>;

  const innerExec: InnerExecuteFn = (part, i, o, id) =>
    execute({
      part: part,
      inputs: i,
      outputs: o,
      partsRepo: repo,
      _debugger,
      insId: id,
      onCompleted,
    });

  const onEvent: Debugger["onEvent"] = _debugger.onEvent || noop;

  const fullInsId = `${parentInsId || "root"}.${insId}`;
  const innerStateId = `${fullInsId}${INNER_STATE_SUFFIX}`;
  const inputsStateId = `${fullInsId}${INPUTS_STATE_SUFFIX}`;

  const innerDebug = debug.extend(fullInsId);

  if (!mainState[innerStateId]) {
    mainState[innerStateId] = new Map();
  }

  if (!mainState[inputsStateId]) {
    mainState[inputsStateId] = new Map();
  }

  let innerState = mainState[innerStateId];
  let inputsState = mainState[inputsStateId];

  const cleanupSetter = (cb: Function) => {
    cleanUps.push(cb);
  };

  const reportInputStateChange = () => {
    const obj = Array.from(inputsState.entries()).reduce((acc, [k, v]) => {
      const isQueue = isQueueInputPinConfig(
        (inputs[k] as any).config,
        inputs[k]
      );
      return { ...acc, [k]: isQueue ? v?.length : 1 };
    }, {});

    onEvent({
      type: DebuggerEventType.INPUTS_STATE_CHANGE,
      val: obj,
      insId,
      parentInsId,
    });
  };

  const advPartContext: PartAdvancedContext = {
    execute: innerExec,
    insId,
    state: mainState[innerStateId],
    onCleanup: cleanupSetter,
    onError: (err: any) => {
      onError(err);
    },
    context: extraContext,
  };

  let processing = false;

  let lastValues;

  const reactiveInputs = (part.reactiveInputs || [])
    /* 
    Reactive inputs that are static shouldn't get a special treatment 
  */
    .filter((inp) => !isStaticInput(inputs[inp]));

  const cleanState = () => {
    mainState[innerStateId].clear();

    // removes all internal state from child parts.
    // TODO - use a better data structure on mainState so this becomes a O(1) operation
    keys(mainState)
      .filter((k) => k.startsWith(`${fullInsId}.`))
      .forEach((k) => {
        mainState[k] = new Map();
      });
  };

  // for each input received, if the state is valid and the part isn't already processing
  // we'll run the part, otherwise, we'll wait for it to be valid

  const maybeRunPart = (input?: { key: string; value: any }) => {
    const isReactiveInput = reactiveInputs.includes(input?.key);

    if (processing && !isReactiveInput) {
      // got input that will be considered only on next run
    } else {
      const isReactiveInputWhileRunning = processing && isReactiveInput;

      const partStateValid = isPartStateValid(inputs, inputsState, part);

      if (partStateValid || isReactiveInputWhileRunning) {
        let argValues;

        if (!processing) {
          // this is the "first" run, pull values
          argValues = pullValuesForExecution(inputs, inputsState, env);

          lastValues = argValues;
          reportInputStateChange();
        } else {
          if (!input) {
            throw new Error(
              `Unexpected state,  got reactive part while not processing and not valid`
            );
          }

          // this is a reactive input, use last non reactive values and push only the reactive one
          const value = pullValueForExecution(
            input.key,
            inputs[input.key],
            inputsState,
            env
          );
          argValues = { ...lastValues, [input.key]: value };
          reportInputStateChange();
        }

        let completedOutputs = new Set();
        let completedOutputsValues = {};

        if (part.completionOutputs) {
          processing = true;

          onEvent({
            type: DebuggerEventType.PROCESSING_CHANGE,
            val: processing,
            insId,
            parentInsId,
          });

          // completion outputs support the "AND" operator via "+" sign, i.e. "a+b,c" means "(a AND b) OR c)""
          const dependenciesArray = part.completionOutputs.map((k) =>
            k.split("+")
          );
          const dependenciesMap = dependenciesArray.reduce((map, currArr) => {
            currArr.forEach((pin) => {
              map.set(pin, currArr);
            });
            return map;
          }, new Map<string, string[]>());

          entries(outputs).forEach(([key, subj]) => {
            subj.pipe(first()).subscribe((val) => {
              completedOutputs.add(key);
              completedOutputsValues[key] = val;

              let requirementArr = dependenciesMap.get(key);

              if (!requirementArr) {
                // this means the pin received is not part of completion output requirements
                return;
              }

              // mutating original array is important here as the impl. relies on different pins reaching the same arr obj
              requirementArr.splice(requirementArr.indexOf(key), 1);

              if (requirementArr.length === 0) {
                processing = false;
                onEvent({
                  type: DebuggerEventType.PROCESSING_CHANGE,
                  val: processing,
                  insId,
                  parentInsId,
                });

                if (onCompleted) {
                  onCompleted(completedOutputsValues);
                }

                cleanState();

                callFnOrFnPromise(
                  partCleanupFn,
                  `Error with cleanup function of ${part.id}`
                );
                partCleanupFn = undefined;
                completedOutputs.clear();
                completedOutputsValues = {};
                // this avoids an endless loop after triggering an ended part with static inputs
                if (
                  hasNewSignificantValues(inputs, inputsState, env, part.id)
                ) {
                  maybeRunPart();
                }
              } else {
                // do nothing, part is not done
              }
            });
          });
        } else {
          // processing = false;
          // runs = 0
          // onProcessing({ processing, insId: stateId });
          cleanState();
        }

        // magic happens here
        try {
          innerDebug(`Running part %s with values %o`, part.id, argValues);
          partCleanupFn = fn(argValues as any, outputs, advPartContext);
        } catch (e) {
          processing = false;
          innerDebug(`Error in part %s - value %e`, part.id, e);
          onEvent({
            type: DebuggerEventType.PROCESSING_CHANGE,
            val: processing,
            insId,
            parentInsId,
          });
          onError(e);
        }

        const maybeReactiveKey = reactiveInputs.find((key) => {
          return (
            inputs[key] &&
            peekValueForExecution(key, inputs[key], inputsState, env, part.id)
          );
        });

        if (maybeReactiveKey) {
          const value = peekValueForExecution(
            maybeReactiveKey,
            inputs[maybeReactiveKey],
            inputsState,
            env,
            part.id
          );
          maybeRunPart({ key: maybeReactiveKey, value });
        } else {
          const hasStaticValuePending = entries(inputs).find(([k, input]) => {
            const isQueue = isQueueInputPinConfig((input as any).config, input);
            // const isNotOptional = !isInputPinOptional(part.inputs[k]);
            const value = peekValueForExecution(
              k,
              input,
              inputsState,
              env,
              part.id
            );
            if (isQueue) {
              return isDefined(value);
            }
          });

          if (hasStaticValuePending) {
            const [key, input] = hasStaticValuePending;

            const value = peekValueForExecution(
              key,
              input,
              inputsState,
              env,
              part.id
            );

            maybeRunPart({ key, value });
          }
        }
      } else {
        // part inputs in an invalid state
      }
    }
  };

  maybeRunPart();
  const cleanSubscriptions = subscribeInputsToState(
    inputs,
    inputsState,
    repo,
    insId,
    (key, value) => {
      debug(`Got input %s - value is [%o]`, key, value);
      reportInputStateChange();

      try {
        maybeRunPart({ key, value });
      } catch (e) {
        onError(e);
      }
    }
  );

  cleanUps.push(cleanSubscriptions);

  return () => {
    callFnOrFnPromise(
      partCleanupFn,
      `Error with cleanup function of ${part.id}`
    );
    cleanUps.forEach((fn: any) => fn());
  };
};

export type ExecuteFn = (params: ExecuteParams) => CancelFn;

export interface PartError extends Error {
  insId: string;
}

export type ExecuteParams = {
  part: Part;
  partsRepo: PartRepo;
  inputs: PartInputs;
  outputs: PartOutputs;
  _debugger?: Debugger;
  insId?: string;
  parentInsId?: string;
  mainState?: OMap<PartState>;
  onBubbleError?: <Err extends PartError>(err: Err) => void;
  env?: ExecuteEnv;
  extraContext?: Record<string, any>;

  onCompleted?: (data: any) => void;
};

export const execute: ExecuteFn = ({
  part,
  inputs,
  outputs,
  partsRepo,
  _debugger = {},
  insId = part.id,
  extraContext = {},
  mainState = {},
  parentInsId = "root",
  onBubbleError = noop, // (err) => { throw err},
  env = {},
  onCompleted = noop,
}) => {
  const toCancel: Function[] = [];

  const codePartExtraContext = { ...extraContext, ENV: env };

  const processedRepo = customRepoToPartRepo(partsRepo, codePartExtraContext);

  const onError = (err: unknown) => {
    // this means "catch the error"
    const error =
      err instanceof Error ? err : new Error(`Raw error: ${err.toString()}`);
    error.message = `error in child instance ${insId}: ${error.message}`;
    if (outputs[ERROR_PIN_ID]) {
      outputs[ERROR_PIN_ID].next(err);
    } else {
      (error as any).insId = insId;
      onBubbleError(error as PartError);
    }
    if (_debugger.onEvent) {
      const err: PartError = error as any;
      err.insId = `${parentInsId}.${insId}`;

      _debugger.onEvent({
        type: DebuggerEventType.ERROR,
        val: err,
        insId,
        parentInsId,
      });
    }
  };

  const processPart = (part: Part): NativePart => {
    if (isGroupedPart(part)) {
      return connect(
        part,
        processedRepo,
        _debugger,
        `${parentInsId}.${insId}`,
        mainState,
        onError,
        env,
        extraContext
      );
    } else if (isCodePart(part)) {
      return codePartToNative(part, codePartExtraContext);
    } else {
      return part;
    }
  };

  const processedPart = processPart(part);

  const onEvent = _debugger.onEvent || noop; // TODO - remove this for "production" mode

  const mediatedOutputs: PartOutputs = {};
  const mediatedInputs: OMap<PartInput> = {};

  entries(inputs).forEach(([pinId, arg]) => {
    if (isDynamicInput(arg)) {
      const mediator = dynamicPartInput({ config: arg.config });
      const subscription = arg.subject.subscribe(async (val) => {
        const res = onEvent({
          type: DebuggerEventType.INPUT_CHANGE,
          insId,
          pinId,
          val,
          parentInsId,
        });
        if (res) {
          const interceptedValue = await res.valuePromise;
          mediator.subject.next(interceptedValue);
        } else {
          if (_debugger.debugDelay) {
            await delay(_debugger.debugDelay);
          }
          mediator.subject.next(val);
        }
      });
      toCancel.push(() => subscription.unsubscribe());
      mediatedInputs[pinId] = mediator;
    } else {
      onEvent({
        type: DebuggerEventType.INPUT_CHANGE,
        insId,
        pinId,
        val: arg.config.value,
        parentInsId,
      });
      const mediator = staticPartInput(
        getStaticValue(arg.config.value, processedRepo, insId)
      );
      mediatedInputs[pinId] = mediator;
    }
  });

  entries(outputs).forEach(([pinId, sub]) => {
    const mediator = dynamicOutput();
    const subscription = mediator.subscribe(async (val) => {
      const res = onEvent({
        type: DebuggerEventType.OUTPUT_CHANGE,
        insId,
        pinId,
        val,
        parentInsId,
      });
      if (res) {
        const interceptedValue = await res.valuePromise;
        sub.next(interceptedValue);
      } else {
        sub.next(val);
      }
    });
    toCancel.push(() => subscription.unsubscribe());
    mediatedOutputs[pinId] = mediator;
  });

  const cancelFn = executeNative({
    part: processedPart,
    inputs: mediatedInputs,
    outputs: mediatedOutputs,
    repo: processedRepo,
    _debugger,
    insId,
    mainState,
    parentInsId,
    onError,
    onBubbleError,
    env,
    extraContext,
    onCompleted,
  });

  return () => {
    toCancel.forEach((fn) => fn());
    cancelFn();
  };
};
/*
start the components, connect the inputs to outputs, push the right sources
*/
