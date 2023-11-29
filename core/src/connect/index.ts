import {
  CodeNode,
  isDynamicInput,
  NodeInput,
  NodeInputs,
  staticNodeInput,
  NodeOutputs,
  dynamicOutput,
  dynamicNodeInput,
  NodeInstance,
  VisualNode,
  queueInputPinConfig,
  isStaticInputPinConfig,
  NodeOutput,
  NodeState,
  getNode,
} from "../node";
import { CancelFn, execute, Debugger, ExecuteEnv } from "../execute";
import { DepGraph, isDefined, noop, okeys, OMap, randomInt } from "../common";
import {
  ERROR_PIN_ID,
  isExternalConnection,
  isExternalConnectionNode,
  isInternalConnectionNode,
  THIS_INS_ID,
  TRIGGER_PIN_ID,
} from "./helpers";

import { NodesCollection } from "..";

export * from "./helpers";

export type ConnectionData = {
  from: ConnectionNode;
  to: ConnectionNode;
  delayed?: boolean;
  hidden?: boolean;
};

export type ExternalConnectionNode = {
  insId: typeof THIS_INS_ID;
  pinId: string;
};

export type InternalConnectionNode = {
  insId: string;
  pinId: string;
};

export type ConnectionNode = ExternalConnectionNode | InternalConnectionNode;

export type PinList = Array<{ insId: string; pinId: string }>;

type PositionlessVisualNode = Omit<
  Omit<VisualNode, "inputsPosition">,
  "outputsPosition"
>;

export const connect = (
  node: PositionlessVisualNode,
  resolvedDeps: NodesCollection,
  _debugger: Debugger = {},
  ancestorsInsIds?: string,
  mainState: OMap<NodeState> = {},
  onBubbleError: (err: any) => void = noop,
  env: ExecuteEnv = {},
  extraContext: Record<string, any> = {}
): CodeNode => {
  const { id: maybeId, connections, instances } = node;

  const nodeId = maybeId || "connected-node" + randomInt(999);

  return {
    inputs: node.inputs,
    outputs: node.outputs,
    id: nodeId,
    completionOutputs: node.completionOutputs,
    reactiveInputs: node.reactiveInputs,
    run: (fnArgs, fnOutputs) => {
      let cancelFns: CancelFn[] = [];

      const depGraph = new DepGraph({});

      const instanceToId = new Map<NodeInstance, string>();
      const idToInstance = new Map<string, NodeInstance>();

      // these hold the args / outputs for each piece of an internal connection
      const instanceArgs = new Map<string, NodeInputs>();
      const instanceOutputs = new Map<string, NodeOutputs>();

      // hold the external connection points to be connected in the end
      const externalInputConnections = new Map<string, NodeInput[]>();
      const externalOutputConnections = new Map<string, NodeOutput[]>();

      // holds status of each instance - if it is running or not, for implicit completion
      let resolveCompletionPromise: any;
      const runningInstances = new Set();

      // build the inputs and outputs of the node itself
      // they will be then connected to fnArgs and fnOutputs and will run the node

      // build all input and output maps
      instances.forEach((instance) => {
        const node = getNode(instance, resolvedDeps);
        const instanceId = instance.id;
        instanceToId.set(instance, instanceId);
        idToInstance.set(instanceId, instance);

        depGraph.addNode(instanceId);

        const inputKeys = Object.keys(node.inputs);
        const outputKeys = Object.keys(node.outputs);

        const args: NodeInputs = {},
          outputs: NodeOutputs = {};

        inputKeys.forEach((k) => {
          const inputConfig =
            (instance.inputConfig || {})[k] || queueInputPinConfig();

          if (isStaticInputPinConfig(inputConfig)) {
            args[k] = staticNodeInput(inputConfig.value);
          } else {
            args[k] = dynamicNodeInput({
              config: inputConfig,
            });
          }
        });

        args[TRIGGER_PIN_ID] = dynamicNodeInput({
          config: queueInputPinConfig(),
        });

        const hasTriggerConnection = connections.some((conn) => {
          return (
            isInternalConnectionNode(conn.to) &&
            conn.to.insId === instance.id &&
            conn.to.pinId === TRIGGER_PIN_ID
          );
        });

        if (hasTriggerConnection) {
          if (instance.inputConfig && instance.inputConfig[TRIGGER_PIN_ID]) {
            throw "Trigger connection can not be configured";
          }
        }

        outputKeys.forEach((out) => {
          const outSubject = dynamicOutput();
          outputs[out] = outSubject;
        });
        const isErrorCaught = connections.some((conn) => {
          return (
            isInternalConnectionNode(conn.from) &&
            conn.from.insId === instance.id &&
            conn.from.pinId === ERROR_PIN_ID
          );
        });
        if (isErrorCaught) {
          outputs[ERROR_PIN_ID] = dynamicOutput();
        }

        instanceArgs.set(instanceId, args);
        instanceOutputs.set(instanceId, outputs);
      });

      /*
       connectedInputs - holds which inputs were used, so the unused can be removed from the actual inputs
       otherwise, "required-if-connected" cannot work properly
      */

      const connectedInputs = new Set();

      connections.forEach((conn) => {
        const { from, to } = conn;

        const { insId: fromInstanceId, pinId: fromInstancePinId } = from;
        const { insId: toInstanceId, pinId: toInstancePinId } = to;

        const fromInstanceOutputs = instanceOutputs.get(fromInstanceId);
        const toInstanceArgs = instanceArgs.get(toInstanceId);

        if (isInternalConnectionNode(to)) {
          connectedInputs.add(`${to.insId}.${to.pinId}`);
        }

        if (isExternalConnection(conn)) {
          // from an input
          if (isExternalConnectionNode(from)) {
            const instanceInput = toInstanceArgs?.[to.pinId];
            if (!instanceInput) {
              throw new Error(
                `Input ${to.pinId} of instance ${toInstanceId} not found`
              );
            }
            const currArr = externalInputConnections.get(from.pinId) || [];
            currArr.push(instanceInput);
            externalInputConnections.set(from.pinId, currArr);
          } else {
            let instanceOutput = fromInstanceOutputs?.[from.pinId];
            if (!instanceOutput) {
              throw new Error(
                `Output ${from.pinId} of instance ${fromInstanceId} not found`
              );
            }
            const currArr = externalOutputConnections.get(to.pinId) || [];
            currArr.push(instanceOutput);
            externalOutputConnections.set(to.pinId, currArr);
          }

          return;
        }

        if (!fromInstanceOutputs) {
          throw new Error(`No outputs found for instance [${fromInstanceId}]`);
        }

        if (!toInstanceArgs) {
          if (!idToInstance.has(toInstanceId)) {
            throw new Error(
              `Instance with id [${toInstanceId}] does not exist!`
            );
          } else {
            throw new Error(`No inputs found for instance [${toInstanceId}]`);
          }
        }

        const sourceOutput = fromInstanceOutputs[fromInstancePinId];

        if (!sourceOutput) {
          throw new Error(
            `Output source - [${fromInstancePinId}] not found in node [${nodeId}]`
          );
        }

        const targetArg = toInstanceArgs[toInstancePinId];

        const sourceInstance = idToInstance.get(fromInstanceId);

        if (!sourceInstance && fromInstanceId !== THIS_INS_ID) {
          throw new Error(
            `Instance [${fromInstanceId}] does not exist! failed to connect [${from}] -> [${to}]`
          );
        }

        const sourceNode = sourceInstance
          ? getNode(sourceInstance, resolvedDeps)
          : node;

        const sourceOutputPin = sourceNode.outputs[fromInstancePinId];
        const isDelayed =
          (sourceOutputPin && sourceOutputPin.delayed) || conn.delayed;

        if (!isDelayed) {
          if (fromInstanceId !== THIS_INS_ID && toInstanceId !== THIS_INS_ID) {
            depGraph.addDependency(fromInstanceId, toInstanceId);
          }
        }

        if (!targetArg) {
          throw new Error(`Target arg - [${to}] not found in node [${nodeId}]`);
        }

        const sub = sourceOutput.subscribe(async (val: any) => {
          if (!isDynamicInput(targetArg)) {
            console.info(targetArg);
            throw new Error(
              `Impossible state listening to non dynamic input - ${toInstanceId}.${toInstancePinId}`
            );
          }
          targetArg.subject.next(val);
        });
        cancelFns.push(() => sub.unsubscribe());
      });

      // connect the external outputs to the outputs that are left hanging
      okeys(fnOutputs).forEach((key) => {
        const outputs = externalOutputConnections.get(key) || [];
        outputs.forEach((output) => {
          const sub = output.subscribe(async (val: any) => {
            if (!fnOutputs[key]) {
              throw new Error(
                `Impossible state - output ${key} does not exist`
              );
            }
            fnOutputs[key]!.next(val);
          });
          cancelFns.push(() => sub.unsubscribe());
        });
      });

      function onInstanceCompleted(insId: string) {
        runningInstances.delete(insId);
        if (runningInstances.size === 0 && resolveCompletionPromise) {
          resolveCompletionPromise();
        }
      }

      function onInstanceStarted(insId: string) {
        runningInstances.add(insId);
      }

      depGraph
        .overallOrder()
        .map((name: string) => idToInstance.get(name))
        .forEach((instance: NodeInstance) => {
          const inputs = instanceArgs.get(instance.id);
          const outputs = instanceOutputs.get(instance.id);

          const node = getNode(instance, resolvedDeps);
          if (!inputs) {
            throw new Error(
              `Unexpected error - args not found when running ${instance}`
            );
          }

          if (!outputs) {
            throw new Error(
              `Unexpected error - outputs not found when running ${instance}`
            );
          }
          // remove unusedInputs

          for (const key in inputs) {
            const inputConfig = instance.inputConfig[key];

            if (
              !connectedInputs.has(`${instance.id}.${key}`) &&
              !isStaticInputPinConfig(inputConfig)
            ) {
              // arg was not connected, remove its
              delete inputs[key];
            }
          }
          // magic happens here - nodes are executed
          const cancel = execute({
            node,
            inputs,
            outputs,
            resolvedDeps: resolvedDeps,
            _debugger,
            insId: instance.id,
            extraContext,
            mainState,
            ancestorsInsIds,
            onBubbleError,
            onCompleted: () => onInstanceCompleted(instance.id),
            onStarted: () => onInstanceStarted(instance.id),
            env,
          });
          cancelFns.push(cancel);
        });

      // connect external args to their hanging inputs and run them
      Object.keys(fnArgs).forEach(async (key) => {
        const inputs = externalInputConnections.get(key) || [];

        inputs.forEach((input) => {
          const fnArg = fnArgs[key];

          if (isDynamicInput(input)) {
            if (isDefined(fnArg)) {
              input.subject.next(fnArg);
            } else {
              // skipping emitting an undefined value. VERY UNSURE OF THIS, TRIGGER WAS VISUAL MERGE
            }
          } else {
            throw new Error(
              `Unsure what to do with key ${key}, input: ${input} of ins ${ancestorsInsIds}`
            );
          }
        });
      });

      if (node.completionOutputs === undefined && runningInstances.size > 0) {
        return new Promise((res) => {
          resolveCompletionPromise = res;
        });
      }

      return () =>
        cancelFns.forEach((fn) => {
          try {
            fn();
          } catch (e) {
            console.error("error unsubscribing", e);
          }
        });
    },
  };
};
