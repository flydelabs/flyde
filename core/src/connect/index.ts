import {
  InternalCodeNode,
  NodeInput,
  NodeInputs,
  NodeOutputs,
  dynamicOutput,
  dynamicNodeInput,
  queueInputPinConfig,
  NodeOutput,
  NodeState,
  InternalVisualNode,
} from "../node";
import { CancelFn, execute, Debugger } from "../execute";
import { DepGraph, isDefined, noop, keys, OMap, randomInt } from "../common";
import {
  ERROR_PIN_ID,
  isExternalConnection,
  isExternalConnectionNode,
  isInternalConnectionNode,
  THIS_INS_ID,
  TRIGGER_PIN_ID,
} from "./helpers";

import { InternalNodeInstance, InternalCodeNodeInstance } from "../node";

export * from "./helpers";

export const composeExecutableNode = (
  node: InternalVisualNode,
  _debugger: Debugger = {},
  ancestorsInsIds?: string,
  mainState: OMap<NodeState> = {},
  onBubbleError: (err: any) => void = noop,
  extraContext: Record<string, any> = {}
): InternalCodeNode => {
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

      const instanceToId = new Map<InternalNodeInstance, string>();
      const idToInstance = new Map<string, InternalNodeInstance>();

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
        const node = instance.node;
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

          args[k] = dynamicNodeInput({
            config: inputConfig,
          });
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
            `Instance [${fromInstanceId}] does not exist! failed to composeExecutableNode [${from}] -> [${to}]`
          );
        }

        const sourceNode = sourceInstance.node;

        const sourceOutputPin = sourceNode.outputs[fromInstancePinId];
        const isDelayed =
          (sourceOutputPin && sourceOutputPin.delayed) || conn.delayed;

        if (!isDelayed) {
          if (fromInstanceId !== THIS_INS_ID && toInstanceId !== THIS_INS_ID) {
            depGraph.addDependency(fromInstanceId, toInstanceId);
          }
        }

        if (!targetArg) {
          throw new Error(`Target arg - [${to.insId}.${to.pinId}] not found in node [${nodeId}]`);
        }

        const sub = sourceOutput.subscribe(async (val: any) => {
          targetArg.subject.next(val);
        });
        cancelFns.push(() => sub.unsubscribe());
      });

      // composeExecutableNode the external outputs to the outputs that are left hanging
      keys(fnOutputs).forEach((key) => {
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
        .forEach((instance: InternalCodeNodeInstance) => {
          const inputs = instanceArgs.get(instance.id);
          const outputs = instanceOutputs.get(instance.id);

          const node = instance.node;
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
            if (!connectedInputs.has(`${instance.id}.${key}`)) {
              // arg was not connected, remove its
              delete inputs[key];
            }
          }
          // magic happens here - nodes are executed
          const cancel = execute({
            node,
            inputs,
            outputs,
            _debugger,
            insId: instance.id,
            extraContext,
            mainState,
            ancestorsInsIds,
            onBubbleError,
            onCompleted: () => onInstanceCompleted(instance.id),
            onStarted: () => onInstanceStarted(instance.id),
          });
          cancelFns.push(cancel);
        });

      // composeExecutableNode external args to their hanging inputs and run them
      Object.keys(fnArgs).forEach(async (key) => {
        const inputs = externalInputConnections.get(key) || [];

        inputs.forEach((input) => {
          const fnArg = fnArgs[key];

          if (isDefined(fnArg)) {
            input.subject.next(fnArg);
          } else {
            // skipping emitting an undefined value. VERY UNSURE OF THIS, TRIGGER WAS VISUAL MERGE
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
