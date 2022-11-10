import { noop, Subject } from "rxjs";
import { first } from "rxjs/operators";

import * as cuid from "cuid";


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
import { codePartToNative, customRepoToPartRepo, PartRepo } from "..";

export type SubjectMap = OMapF<Subject<any>>;

export type ExecutionState = Map<string, any>;

export type CancelFn = () => void;

export type DebuggerInterceptCommand = {
  cmd: "intercept";
  valuePromise: Promise<any>;
};

export type DebuggerCommand = DebuggerInterceptCommand | void;

export type DebuggerValue = {
  pinId: string;
  insId: string;
  val: any;
  time: number;
  partId: string;
  executionId: string;
};

export type ProcessingChangeData = {
  processing: boolean;
  insId: string;
};

export interface PartError extends Error {
  insId: string;
}

export type InputsStateChangeData = {
  inputs: OMap<number>;
  insId: string;
};

export type Debugger = {
  onInput?: (value: DebuggerValue) => DebuggerCommand;
  onOutput?: (value: DebuggerValue) => DebuggerCommand;
  onProcessing?: (value: ProcessingChangeData) => void;
  onInputsStateChange?: (value: InputsStateChangeData) => void;
  debugDelay?: number;
  onError?: (err: PartError) => void;
};

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
    onBubbleError,
    env,
    extraContext
  } = data;
  const { fn } = part;

  const debug = debugLogger("core");

  const cleanUps: any = [];
  let partCleanupFn: any;

  const innerExec: InnerExecuteFn = (part, i, o, id) => execute({part: part, inputs: i, outputs: o, partsRepo: repo, _debugger, insId: id});

  const onProcessing: Debugger["onProcessing"] = _debugger.onProcessing || noop;
  const onInputsStateChange: Debugger["onInputsStateChange"] =
    _debugger.onInputsStateChange || noop;

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
      const isQueue = isQueueInputPinConfig((inputs[k] as any).config, inputs[k]);
      return { ...acc, [k]: isQueue ? v?.length : 1 };
    }, {});

    onInputsStateChange({ inputs: obj, insId: fullInsId });
  };
  
  const advPartContext: PartAdvancedContext = {
    execute: innerExec,
    insId,
    state: mainState[innerStateId],
    onCleanup: cleanupSetter,
    onError: (err: any) => {
      onError(err);
    },
    context: extraContext
  };

  let processing = false;

  let lastValues;

  let runs = 0;

  const reactiveInputs = part.reactiveInputs || [];

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

      const partStateValid = isPartStateValid(inputs, inputsState, part, lastValues);      

      if (partStateValid || isReactiveInputWhileRunning) {
        let argValues;

        if (!processing) {
          // this is the "first" run, pull values
          argValues = pullValuesForExecution(inputs, inputsState, env);

          lastValues = argValues;
          reportInputStateChange();
        } else {
          // this is a reactive input, use last non reactive values and push only the reactive one
          if (!input) {
            throw new Error(
              `Unexpected state,  got reactive part while not processing and not valid`
            );
          }

          const value = pullValueForExecution(input.key, inputs[input.key], inputsState, env);
          argValues = { ...lastValues, [input.key]: value };
          reportInputStateChange();
        }

        let completedOutputs = new Set();

        if (part.completionOutputs) {
          processing = true;
          onProcessing({ processing, insId: fullInsId });

          // completion outputs support the "AND" operator via "+" sign, i.e. "a+b,c" means "(a AND b) OR c)""
          const dependenciesArray = part.completionOutputs.map(k => k.split('+'));
          const dependenciesMap = dependenciesArray.reduce((map, currArr) => {
            currArr.forEach((pin) => {
              map.set(pin, currArr);
            });
            return map;
          }, new Map<string, string[]>());

          entries(outputs).forEach(([key, subj]) => {
            subj.pipe(first()).subscribe((val) => {
              completedOutputs.add(key);

              let requirementArr = dependenciesMap.get(key);

              if (!requirementArr) {
                // this means the pin received is not part of completion output requirements
                return;
              }
  
              // mutating original array is important here as the impl. relies on different pins reaching the same arr obj
              requirementArr.splice(requirementArr.indexOf(key), 1)
              

              if (requirementArr.length === 0) {
                processing = false;
                onProcessing({ processing, insId: fullInsId });

                cleanState();
                if (partCleanupFn) {
                  partCleanupFn();
                  partCleanupFn = undefined;
                } else {
                  // no cleanup
                }

                completedOutputs.clear();
                // this avoids an endless loop after triggerring an ended part with static inputs
                if (hasNewSignificantValues(inputs, inputsState, env, part.id)) {
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
          onProcessing({ processing, insId: fullInsId });
          onError(e);
        }

        const hasReactiveInputInPipe = reactiveInputs.find((key) => {
          return inputs[key] && peekValueForExecution(key, inputs[key], inputsState, env, part.id);
        });

        if (hasReactiveInputInPipe) {
          const value = peekValueForExecution(
            hasReactiveInputInPipe,
            inputs[hasReactiveInputInPipe],
            inputsState,
            env,
            part.id
          );
          maybeRunPart({ key: hasReactiveInputInPipe, value });
        } else {
          const hasStaticValuePending = entries(inputs).find(([k, input]) => {
            const isQueue = isQueueInputPinConfig((input as any).config, input);
            // const isNotOptional = !isInputPinOptional(part.inputs[k]);
            const value = peekValueForExecution(k, input, inputsState, env, part.id);
            if (isQueue) {
              return isDefined(value);
            }
          });

          if (hasStaticValuePending) {
            const [key, input] = hasStaticValuePending;

            const value = peekValueForExecution(key, input, inputsState, env, part.id);

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
    if (partCleanupFn) {
      partCleanupFn();
    }
    cleanUps.forEach((fn: any) => fn());
  };
};

export type ExecuteFn = (params: ExecuteParams) => CancelFn;

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
}


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
  env = {}
}) => {
  const toCancel: Function[] = [];

  const executionId = cuid();

  const codePartExtraContext = { ...extraContext, ENV: env };

  const processedRepo = customRepoToPartRepo(partsRepo, codePartExtraContext);
  
  const onError = (err: unknown) => {
    // this means "catch the error"
    if (outputs[ERROR_PIN_ID]) {
      outputs[ERROR_PIN_ID].next(err);
    } else {
      const error = err instanceof Error ? err : new Error(`Raw error: ${err.toString()}`);      
      error.message = `error in child instance ${insId}: ${error.message}`;
      (error as any).insId = insId;
      onBubbleError(error as PartError);

      if (_debugger.onError) {
        const err: PartError = error as any;
        err.insId = `${parentInsId}.${insId}`;
        _debugger.onError(err);
      }
    }
  };

  const processPart = (part: Part): NativePart => {
    if (isGroupedPart(part)) {
      return connect(part, processedRepo, _debugger, `${parentInsId}.${insId}`, mainState, onError, env, extraContext);
    } else if (isCodePart(part)) {
      return codePartToNative(part, codePartExtraContext);
    } else {
      return part;
    }
  };

  const processedPart = processPart(part);

  const onInput = _debugger.onInput || noop; // TODO - remove this for "production" mode
  const onOutput = _debugger.onOutput || noop;

  const mediatedOutputs: PartOutputs = {};
  const mediatedInputs: OMap<PartInput> = {};

  const fullInsId = `${parentInsId}.${insId}`;

  entries(inputs).forEach(([pinId, arg]) => {
    if (isDynamicInput(arg)) {
      const mediator = dynamicPartInput({ config: arg.config });
      const subscription = arg.subject.subscribe(async (val) => {
        const res = onInput({
          insId: fullInsId,
          pinId,
          val,
          time: Date.now(),
          partId: processedPart.id,
          executionId,
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
      const mediator = staticPartInput(getStaticValue(arg.config.value, processedRepo, insId));
      mediatedInputs[pinId] = mediator;
    }
  });

  entries(outputs).forEach(([pinId, sub]) => {
    const mediator = dynamicOutput();
    const subscription = mediator.subscribe(async (val) => {
      const res = onOutput({
        insId: fullInsId,
        pinId,
        val,
        time: Date.now(),
        partId: processedPart.id,
        executionId,
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
    extraContext
  });

  return () => {
    toCancel.forEach((fn) => fn());
    cancelFn();
  };
};
/*
start the components, connect the inputs to outputs, push the right sources
*/
