import { noop, Subject } from "rxjs";
import { first } from "rxjs/operators";

export * from "./debugger";

import {
  isDynamicInput,
  dynamicNodeInput,
  dynamicOutput,
  Node,
  getStaticValue,
  isInlineValueNode,
  isVisualNode,
  CodeNode,
  NodeInputs,
  NodeOutputs,
  staticNodeInput,
  NodeAdvancedContext,
  isQueueInputPinConfig,
  NodeInstanceError,
  NodeState,
  RunNodeFunction,
  NodesCollection,
} from "../node";

import { connect, ERROR_PIN_ID } from "../connect";

import {
  hasNewSignificantValues,
  isNodeStateValid,
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
import { isStaticInputPinConfig } from "../node";
import { Debugger, DebuggerEvent, DebuggerEventType } from "./debugger";
import {
  customNodesToNodesCollection,
  inlineValueNodeToNode,
} from "../inline-value-to-code-node";

export type SubjectMap = OMapF<Subject<any>>;

export type ExecutionState = Map<string, any>;

export type CancelFn = () => void;

export type ExecuteEnv = OMap<any>;

export type InnerExecuteFn = (
  node: Node,
  args: NodeInputs,
  outputs: NodeOutputs,
  insId: string
) => CancelFn;

export type CodeExecutionData = {
  node: CodeNode;
  inputs: NodeInputs;
  outputs: NodeOutputs;
  resolvedDeps: NodesCollection;
  _debugger?: Debugger;
  /**
   * If the node is an instance of another node, this is the id of the instance.
   * If the node is the root node, this is "__root".
   * Used for debugger events and state namespacing
   */
  insId: string;
  /**
   * A full path of ancestor insIds, separated by dots.
   * Used for debugger events and state namespacing
   */
  ancestorsInsIds?: string;
  extraContext?: Record<string, any>;
  mainState: OMap<NodeState>;
  onError: (err: any) => void;
  onBubbleError: (err: any) => void;
  env: ExecuteEnv;
  // TODO - think of combining these below + onEvent into one
  onCompleted?: (data: any) => void;
  onStarted?: () => void;
};

export const INNER_STATE_SUFFIX = "_inner";
export const INPUTS_STATE_SUFFIX = "_inputs";

const executeCodeNode = (data: CodeExecutionData) => {
  const {
    node,
    inputs,
    outputs,
    resolvedDeps: resolvedDeps,
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
  const { run, fn } = node;

  const debug = debugLogger("core");

  const cleanUps: any = [];
  let nodeCleanupFn: ReturnType<RunNodeFunction>;

  const innerExec: InnerExecuteFn = (node, i, o, id) =>
    execute({
      node: node,
      inputs: i,
      outputs: o,
      resolvedDeps,
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
      nodeId: node.id,
    });
  };

  const advNodeContext: NodeAdvancedContext = {
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

  const reactiveInputs = (node.reactiveInputs || [])
    /* 
    Reactive inputs that are static shouldn't get a special treatment 
  */
    .filter((inp) => !isStaticInputPinConfig(inputs[inp]?.config));

  const cleanState = () => {
    mainState[innerStateId]?.clear();

    // removes all internal state from child nodes.
    // TODO - use a better data structure on mainState so this becomes a O(1) operation
    keys(mainState)
      .filter((k) => k.startsWith(`${fullInsId}.`))
      .forEach((k) => {
        mainState[k] = new Map();
      });
  };

  // for each input received, if the state is valid and the node isn't already processing
  // we'll run the node, otherwise, we'll wait for it to be valid

  const maybeRunNode = (input?: { key: string; value: any }) => {
    const isReactiveInput = input?.key && reactiveInputs.includes(input?.key);

    if (processing && !isReactiveInput) {
      // got input that will be considered only on next run
    } else {
      const isReactiveInputWhileRunning = processing && isReactiveInput;

      const nodeStateValid = isNodeStateValid(inputs, inputsState, node);

      if (nodeStateValid || isReactiveInputWhileRunning) {
        let argValues;

        if (!processing) {
          // this is the "first" run, pull values
          argValues = pullValuesForExecution(inputs, inputsState, env);

          lastValues = argValues;
          reportInputStateChange();
        } else {
          if (!input) {
            throw new Error(
              `Unexpected state,  got reactive node while not processing and not valid`
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
          nodeId: node.id,
        });
        if (node.completionOutputs) {
          // completion outputs support the "AND" operator via "+" sign, i.e. "a+b,c" means "(a AND b) OR c)""
          const dependenciesArray = node.completionOutputs.map((k) =>
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
                // this means the pin received is not node of completion output requirements
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
                  nodeId: node.id,
                });

                if (onCompleted) {
                  onCompleted(completedOutputsValues);
                }

                cleanState();

                callFnOrFnPromise(
                  nodeCleanupFn,
                  `Error with cleanup function of ${node.id}`
                );
                nodeCleanupFn = undefined;
                completedOutputs.clear();
                completedOutputsValues = {};
                // this avoids an endless loop after triggering an ended node with static inputs
                if (
                  hasNewSignificantValues(inputs, inputsState, env, node.id)
                ) {
                  maybeRunNode();
                }
              } else {
                // do nothing, node is not done
              }
            });
          });
        } else {
          entries(outputs).forEach(([key, subj]) => {
            subj.subscribe((val) => {
              completedOutputsValues[key] = val;
            });
          });
        }

        // magic happens here
        try {
          innerDebug(`Running node %s with values %o`, node.id, argValues);

          if (onStarted) {
            onStarted();
          }

          nodeCleanupFn = (fn ?? run)(
            argValues as any,
            outputs,
            advNodeContext
          );

          if (isPromise(nodeCleanupFn)) {
            nodeCleanupFn
              .then(() => {
                if (node.completionOutputs === undefined && onCompleted) {
                  processing = false;
                  onEvent({
                    type: DebuggerEventType.PROCESSING_CHANGE,
                    val: processing,
                    insId,
                    ancestorsInsIds: ancestorsInsIds,
                    nodeId: node.id,
                  });

                  onCompleted(completedOutputsValues);
                  cleanState();

                  if (
                    hasNewSignificantValues(inputs, inputsState, env, node.id)
                  ) {
                    maybeRunNode();
                  }
                }
              })
              .catch((err) => {
                onError(err);
                processing = false;
                innerDebug(`Error in node %s - value %e`, node.id, err);
                onEvent({
                  type: DebuggerEventType.PROCESSING_CHANGE,
                  val: processing,
                  insId,
                  ancestorsInsIds: ancestorsInsIds,
                  nodeId: node.id,
                });
              });
          } else {
            if (node.completionOutputs === undefined && onCompleted) {
              processing = false;
              onEvent({
                type: DebuggerEventType.PROCESSING_CHANGE,
                val: processing,
                insId,
                ancestorsInsIds: ancestorsInsIds,
                nodeId: node.id,
              });
              onCompleted(completedOutputsValues);
              cleanState();
            }
          }
        } catch (e) {
          onError(e);
          processing = false;
          innerDebug(`Error in node %s - value %e`, node.id, e);
          onEvent({
            type: DebuggerEventType.PROCESSING_CHANGE,
            val: processing,
            insId,
            ancestorsInsIds: ancestorsInsIds,
            nodeId: node.id,
          });
        }

        const maybeReactiveKey = reactiveInputs.find((key) => {
          return (
            inputs[key] &&
            peekValueForExecution(key, inputs[key]!, inputsState, env, node.id)
          );
        });

        if (maybeReactiveKey) {
          const value = peekValueForExecution(
            maybeReactiveKey,
            inputs[maybeReactiveKey]!,
            inputsState,
            env,
            node.id
          );
          maybeRunNode({ key: maybeReactiveKey, value });
        } else {
          const hasStaticValuePending = entries(inputs).find(([k, input]) => {
            const isQueue = isQueueInputPinConfig((input as any).config);
            // const isNotOptional = !isInputPinOptional(node.inputs[k]);
            const value = peekValueForExecution(
              k,
              input,
              inputsState,
              env,
              node.id
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
              node.id
            );

            maybeRunNode({ key, value });
          }
        }
      } else {
        // node inputs in an invalid state
      }
    }
  };

  maybeRunNode();
  const cleanSubscriptions = subscribeInputsToState(
    inputs,
    inputsState,
    (key, value) => {
      debug(`Got input %s - value is [%o]`, key, value);
      reportInputStateChange();

      try {
        maybeRunNode({ key, value });
      } catch (e) {
        onError(e);
      }
    }
  );

  cleanUps.push(cleanSubscriptions);

  return () => {
    callFnOrFnPromise(
      nodeCleanupFn,
      `Error with cleanup function of ${node.id}`
    );
    cleanUps.forEach((fn: any) => fn());
  };
};

export type ExecuteFn = (params: ExecuteParams) => CancelFn;

export type ExecuteParams = {
  node: Node;
  resolvedDeps: NodesCollection;
  inputs: NodeInputs;
  outputs: NodeOutputs;
  _debugger?: Debugger;
  insId?: string;
  ancestorsInsIds?: string;
  mainState?: OMap<NodeState>;
  onBubbleError?: (err: NodeInstanceError) => void;
  env?: ExecuteEnv;
  extraContext?: Record<string, any>;

  onCompleted?: (data: any) => void;
  onStarted?: () => void;
};

export const ROOT_INS_ID = "__root";

export const GLOBAL_STATE_NS = "____global";

export const execute: ExecuteFn = ({
  node,
  inputs,
  outputs,
  resolvedDeps,
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

  const inlineValueNodeContext = { ...extraContext, ENV: env };

  const processedNodes = customNodesToNodesCollection(
    resolvedDeps,
    inlineValueNodeContext
  );

  const onError = (err: unknown) => {
    // this means "catch the error"
    const error =
      err instanceof NodeInstanceError
        ? err
        : new NodeInstanceError(
            err,
            fullInsIdPath(insId, ancestorsInsIds),
            node.id
          );

    if (_debugger.onEvent) {
      _debugger.onEvent({
        type: DebuggerEventType.ERROR,
        val: error,
        insId,
        ancestorsInsIds,
        nodeId: node.id,
      });
    }
    if (outputs[ERROR_PIN_ID]) {
      outputs[ERROR_PIN_ID].next(error);
    } else {
      onBubbleError(error);
    }
  };

  const processNode = (node: Node): CodeNode => {
    if (isVisualNode(node)) {
      return connect(
        node,
        processedNodes,
        _debugger,
        fullInsIdPath(insId, ancestorsInsIds),
        mainState,
        onError,
        env,
        extraContext
      );
    } else if (isInlineValueNode(node)) {
      return inlineValueNodeToNode(node, inlineValueNodeContext);
    } else {
      return node;
    }
  };

  const processedNode = processNode(node);

  const onEvent = _debugger.onEvent || noop; // TODO - remove this for "production" mode

  const mediatedOutputs: NodeOutputs = {};
  const mediatedInputs: NodeInputs = {};

  entries(inputs).forEach(([pinId, arg]) => {
    if (isDynamicInput(arg)) {
      const mediator = dynamicNodeInput({ config: arg.config });
      const subscription = arg.subject.subscribe(async (val) => {
        const res = onEvent({
          type: DebuggerEventType.INPUT_CHANGE,
          insId,
          pinId,
          val,
          ancestorsInsIds,
          nodeId: node.id,
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
        nodeId: node.id,
      } as DebuggerEvent);
      const mediator = staticNodeInput(
        getStaticValue(arg.config.value, processedNodes, insId)
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
        nodeId: node.id,
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

  const cancelFn = executeCodeNode({
    node: processedNode,
    inputs: mediatedInputs,
    outputs: mediatedOutputs,
    resolvedDeps: processedNodes,
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
start the nodes, connect the inputs to outputs, push the right sources
*/
