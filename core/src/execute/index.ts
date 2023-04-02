import { noop, Subject } from "rxjs";
import { first } from "rxjs/operators";

export * from "./debugger";

import {
  isDynamicInput,
  dynamicPartInput,
  dynamicOutput,
  Part,
  getStaticValue,
  isInlineValuePart,
  isVisualPart,
  CodePart,
  PartInputs,
  PartOutputs,
  staticPartInput,
  PartAdvancedContext,
  isQueueInputPinConfig,
  PartInstanceError,
  PartState,
  PartFn,
  PartRepo,
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
import {
  callFnOrFnPromise,
  delay,
  entries,
  fullInsIdPath,
  isDefined,
  isPromise,
  keys,
  OMap,
  OMapF,
} from "../common";
import { debugLogger } from "../common/debug-logger";
import { isStaticInputPinConfig } from "../part";
import { Debugger, DebuggerEvent, DebuggerEventType } from "./debugger";
import {
  customRepoToPartRepo,
  inlineValuePartToPart,
} from "../inline-value-to-code-part";

export type SubjectMap = OMapF<Subject<any>>;

export type ExecutionState = Map<string, any>;

export type CancelFn = () => void;

export type ExecuteEnv = OMap<any>;

export type InnerExecuteFn = (
  part: Part,
  args: PartInputs,
  outputs: PartOutputs,
  insId: string
) => CancelFn;

export type CodeExecutionData = {
  part: CodePart;
  inputs: PartInputs;
  outputs: PartOutputs;
  repo: PartRepo;
  _debugger?: Debugger;
  /**
   * If the part is an instance of another part, this is the id of the instance.
   * If the part is the root part, this is "__root".
   * Used for debugger events and state namespacing
   */
  insId: string;
  /**
   * A full path of ancestor insIds, separated by dots.
   * Used for debugger events and state namespacing
   */
  ancestorsInsIds?: string;
  extraContext?: Record<string, any>;
  mainState: OMap<PartState>;
  onError: (err: any) => void;
  onBubbleError: (err: any) => void;
  env: ExecuteEnv;
  // TODO - think of combining these below + onEvent into one
  onCompleted?: (data: any) => void;
  onStarted?: () => void;
};

export const INNER_STATE_SUFFIX = "_inner";
export const INPUTS_STATE_SUFFIX = "_inputs";

const executeCodePart = (data: CodeExecutionData) => {
  const {
    part,
    inputs,
    outputs,
    repo,
    _debugger,
    insId,
    ancestorsInsIds,
    mainState,
    onError,
    onStarted,
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
      onStarted,
    });

  const onEvent: Debugger["onEvent"] = _debugger?.onEvent || noop;

  const fullInsId = fullInsIdPath(insId, ancestorsInsIds);
  const innerStateId = `${fullInsId}${INNER_STATE_SUFFIX}`;
  const inputsStateId = `${fullInsId}${INPUTS_STATE_SUFFIX}`;

  const innerDebug = debug.extend(fullInsId);

  const globalState = mainState[GLOBAL_STATE_NS];

  if (!mainState[innerStateId]) {
    mainState[innerStateId] = new Map();
  }

  if (!mainState[inputsStateId]) {
    mainState[inputsStateId] = new Map();
  }

  let inputsState = mainState[inputsStateId] ?? new Map();

  const cleanupSetter = (cb: Function) => {
    cleanUps.push(cb);
  };

  const reportInputStateChange = () => {
    const obj = Array.from(inputsState.entries()).reduce((acc, [k, v]) => {
      const isQueue = isQueueInputPinConfig((inputs[k] as any).config);
      return { ...acc, [k]: isQueue ? v?.length : 1 };
    }, {});

    onEvent({
      type: DebuggerEventType.INPUTS_STATE_CHANGE,
      val: obj,
      insId,
      ancestorsInsIds: ancestorsInsIds,
      partId: part.id,
    });
  };

  const advPartContext: PartAdvancedContext = {
    execute: innerExec,
    insId,
    state: mainState[innerStateId] ?? new Map(),
    onCleanup: cleanupSetter,
    onError: (err: any) => {
      onError(err);
    },
    context: extraContext ?? {},
    ancestorsInsIds: ancestorsInsIds,
    globalState,
  };

  let processing = false;

  let lastValues: Record<string, unknown>;

  const reactiveInputs = (part.reactiveInputs || [])
    /* 
    Reactive inputs that are static shouldn't get a special treatment 
  */
    .filter((inp) => !isStaticInputPinConfig(inputs[inp]?.config));

  const cleanState = () => {
    mainState[innerStateId]?.clear();

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
    const isReactiveInput = input?.key && reactiveInputs.includes(input?.key);

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
            inputs[input.key]!,
            inputsState,
            env
          );
          argValues = { ...lastValues, [input.key]: value };
          reportInputStateChange();
        }

        let completedOutputs = new Set();
        let completedOutputsValues: Record<string, unknown> = {};

        processing = true;

        onEvent({
          type: DebuggerEventType.PROCESSING_CHANGE,
          val: processing,
          insId,
          ancestorsInsIds: ancestorsInsIds,
          partId: part.id,
        });
        if (part.completionOutputs) {
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
                  ancestorsInsIds: ancestorsInsIds,
                  partId: part.id,
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
        }

        // magic happens here
        try {
          innerDebug(`Running part %s with values %o`, part.id, argValues);

          if (onStarted) {
            onStarted();
          }
          partCleanupFn = fn(argValues as any, outputs, advPartContext);

          if (isPromise(partCleanupFn)) {
            partCleanupFn
              .then(() => {
                if (part.completionOutputs === undefined && onCompleted) {
                  processing = false;
                  onEvent({
                    type: DebuggerEventType.PROCESSING_CHANGE,
                    val: processing,
                    insId,
                    ancestorsInsIds: ancestorsInsIds,
                    partId: part.id,
                  });

                  onCompleted(completedOutputsValues);
                  cleanState();

                  if (
                    hasNewSignificantValues(inputs, inputsState, env, part.id)
                  ) {
                    maybeRunPart();
                  }
                }
              })
              .catch((err) => {
                onError(err);
                processing = false;
                innerDebug(`Error in part %s - value %e`, part.id, err);
                onEvent({
                  type: DebuggerEventType.PROCESSING_CHANGE,
                  val: processing,
                  insId,
                  ancestorsInsIds: ancestorsInsIds,
                  partId: part.id,
                });
              });
          } else {
            if (part.completionOutputs === undefined && onCompleted) {
              processing = false;
              onEvent({
                type: DebuggerEventType.PROCESSING_CHANGE,
                val: processing,
                insId,
                ancestorsInsIds: ancestorsInsIds,
                partId: part.id,
              });
              onCompleted(completedOutputsValues);
              cleanState();
            }
          }
        } catch (e) {
          onError(e);
          processing = false;
          innerDebug(`Error in part %s - value %e`, part.id, e);
          onEvent({
            type: DebuggerEventType.PROCESSING_CHANGE,
            val: processing,
            insId,
            ancestorsInsIds: ancestorsInsIds,
            partId: part.id,
          });
        }

        const maybeReactiveKey = reactiveInputs.find((key) => {
          return (
            inputs[key] &&
            peekValueForExecution(key, inputs[key]!, inputsState, env, part.id)
          );
        });

        if (maybeReactiveKey) {
          const value = peekValueForExecution(
            maybeReactiveKey,
            inputs[maybeReactiveKey]!,
            inputsState,
            env,
            part.id
          );
          maybeRunPart({ key: maybeReactiveKey, value });
        } else {
          const hasStaticValuePending = entries(inputs).find(([k, input]) => {
            const isQueue = isQueueInputPinConfig((input as any).config);
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
            return false;
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

export type ExecuteParams = {
  part: Part;
  partsRepo: PartRepo;
  inputs: PartInputs;
  outputs: PartOutputs;
  _debugger?: Debugger;
  insId?: string;
  ancestorsInsIds?: string;
  mainState?: OMap<PartState>;
  onBubbleError?: (err: PartInstanceError) => void;
  env?: ExecuteEnv;
  extraContext?: Record<string, any>;

  onCompleted?: (data: any) => void;
  onStarted?: () => void;
};

export const ROOT_INS_ID = "__root";

export const GLOBAL_STATE_NS = "____global";

export const execute: ExecuteFn = ({
  part,
  inputs,
  outputs,
  partsRepo,
  _debugger = {},
  insId = ROOT_INS_ID,
  extraContext = {},
  mainState = {},
  ancestorsInsIds,
  onBubbleError = noop, // (err) => { throw err},
  env = {},
  onCompleted = noop,
  onStarted = noop,
}) => {
  const toCancel: Function[] = [];

  if (!mainState[GLOBAL_STATE_NS]) {
    mainState[GLOBAL_STATE_NS] = new Map();
  }

  const inlineValuePartContext = { ...extraContext, ENV: env };

  const processedRepo = customRepoToPartRepo(partsRepo, inlineValuePartContext);

  const onError = (err: unknown) => {
    // this means "catch the error"
    const error =
      err instanceof PartInstanceError
        ? err
        : new PartInstanceError(
            err,
            fullInsIdPath(insId, ancestorsInsIds),
            part.id
          );

    if (_debugger.onEvent) {
      _debugger.onEvent({
        type: DebuggerEventType.ERROR,
        val: error,
        insId,
        ancestorsInsIds,
        partId: part.id,
      });
    }
    if (outputs[ERROR_PIN_ID]) {
      outputs[ERROR_PIN_ID].next(error);
    } else {
      onBubbleError(error);
    }
  };

  const processPart = (part: Part): CodePart => {
    if (isVisualPart(part)) {
      return connect(
        part,
        processedRepo,
        _debugger,
        fullInsIdPath(insId, ancestorsInsIds),
        mainState,
        onError,
        env,
        extraContext
      );
    } else if (isInlineValuePart(part)) {
      return inlineValuePartToPart(part, inlineValuePartContext);
    } else {
      return part;
    }
  };

  const processedPart = processPart(part);

  const onEvent = _debugger.onEvent || noop; // TODO - remove this for "production" mode

  const mediatedOutputs: PartOutputs = {};
  const mediatedInputs: PartInputs = {};

  entries(inputs).forEach(([pinId, arg]) => {
    if (isDynamicInput(arg)) {
      const mediator = dynamicPartInput({ config: arg.config });
      const subscription = arg.subject.subscribe(async (val) => {
        const res = onEvent({
          type: DebuggerEventType.INPUT_CHANGE,
          insId,
          pinId,
          val,
          ancestorsInsIds,
          partId: part.id,
        } as DebuggerEvent);
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
        ancestorsInsIds,
        partId: part.id,
      } as DebuggerEvent);
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
        ancestorsInsIds: ancestorsInsIds,
        partId: part.id,
      } as DebuggerEvent);
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

  const cancelFn = executeCodePart({
    part: processedPart,
    inputs: mediatedInputs,
    outputs: mediatedOutputs,
    repo: processedRepo,
    _debugger,
    insId,
    mainState,
    ancestorsInsIds: ancestorsInsIds,
    onError,
    onBubbleError,
    env,
    extraContext,
    onCompleted,
    onStarted,
  });

  return () => {
    toCancel.forEach((fn) => fn());
    cancelFn();
  };
};
/*
start the components, connect the inputs to outputs, push the right sources
*/
