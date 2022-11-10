import {
  NativePart,
  isDynamicInput,
  PartInput,
  PartInputs,
  staticPartInput,
  PartOutputs,
  dynamicOutput,
  dynamicPartInput,
  PartInstance,
  GroupedPart,
  queueInputPinConfig,
  isStaticInputPinConfig,
  PartOutput,
  PartState,
  isStickyInputPinConfig,
  getPart,
  PartAdvancedContext,
} from "../part";
import { CancelFn, execute, Debugger, ExecuteEnv } from "../execute";
import { DepGraph, isDefined, noop, okeys, OMap, randomInt, values } from "../common";
import {
  ERROR_PIN_ID,
  isExternalConnection,
  isExternalConnectionNode,
  isInternalConnectionNode,
  THIS_INS_ID,
  TRIGGER_PIN_ID,
} from "./helpers";

import { PartRepo } from "..";

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

type PositionlessGroupedPart = Omit<Omit<GroupedPart, "inputsPosition">, "outputsPosition">;

export const connect = (
  part: PositionlessGroupedPart,
  repo: PartRepo,
  _debugger: Debugger = {},
  parentInsId: string = "root",
  mainState: OMap<PartState> = { bob: new Map() },
  onBubbleError: (err: any) => void = noop,
  env: ExecuteEnv = {},
  extraContext: Record<string, any> = {}
): NativePart => {
  const { id: maybeId, connections, instances } = part;

  const partId = maybeId || "connected-part" + randomInt(999);

  return {
    inputs: part.inputs,
    outputs: part.outputs,
    id: partId,
    completionOutputs: part.completionOutputs,
    reactiveInputs: part.reactiveInputs,
    fn: (fnArgs, fnOutputs) => {
      let cancelFns: CancelFn[] = [];

      const depGraph = new DepGraph({});

      const instanceToId = new Map<PartInstance, string>();
      const idToInstance = new Map<string, PartInstance>();

      // these hold the args / outputs for each piece of an internal connection
      const instanceArgs = new Map<string, PartInputs>();
      const instanceOutputs = new Map<string, PartOutputs>();

      // hold the external connection points to be connected in the end
      const externalInputConnections = new Map<string, PartInput[]>();
      const externalOutputConnections = new Map<string, PartOutput[]>();

      // build the inputs and outputs of the part itself
      // they will be then connected to fnArgs and fnOutputs and will run the part

      // build all input and output maps
      instances.forEach((instance) => {
        const part = getPart(instance, repo);
        const instanceId = instance.id;
        instanceToId.set(instance, instanceId);
        idToInstance.set(instanceId, instance);

        depGraph.addNode(instanceId);

        const inputKeys = Object.keys(part.inputs);
        const outputKeys = Object.keys(part.outputs);

        const args: PartInputs = {},
          outputs: PartOutputs = {};

        inputKeys.forEach((k) => {
          const inputConfig = (instance.inputConfig || {})[k] || queueInputPinConfig();

          if (isStaticInputPinConfig(inputConfig)) {
            args[k] = staticPartInput(inputConfig.value);
          } else {
            args[k] = dynamicPartInput({
              config: inputConfig,
            });
          }
        });

        args[TRIGGER_PIN_ID] = dynamicPartInput({
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
            const instanceInput = toInstanceArgs[to.pinId];
            if (!instanceInput) {
              throw new Error(`Input ${to.pinId} of instance ${toInstanceId} not found`);
            }
            const currArr = externalInputConnections.get(from.pinId) || [];
            currArr.push(instanceInput);
            externalInputConnections.set(from.pinId, currArr);
          } else {
            let instanceOutput = fromInstanceOutputs[from.pinId];
            if (!instanceOutput) {
              throw new Error(`Output ${from.pinId} of instance ${fromInstanceId} not found`);
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
            throw new Error(`Instance with id [${toInstanceId}] does not exist!`);
          } else {
            throw new Error(`No inputs found for instance [${toInstanceId}]`);
          }
        }

        const sourceOutput = fromInstanceOutputs[fromInstancePinId];

        if (!sourceOutput) {
          throw new Error(`Output source - [${from}] not found in part [${partId}]`);
        }

        const targetArg = toInstanceArgs[toInstancePinId];

        const sourceInstance = idToInstance.get(fromInstanceId);

        if (!sourceInstance && fromInstanceId !== THIS_INS_ID) {
          throw new Error(
            `Instance [${fromInstanceId}] does not exist! failed to connect [${from}] -> [${to}]`
          );
        }

        const sourcePart = sourceInstance ? getPart(sourceInstance, repo) : part;

        const sourceOutputPin = sourcePart.outputs[fromInstancePinId];
        const isDelayed = (sourceOutputPin && sourceOutputPin.delayed) || conn.delayed;

        if (!isDelayed) {
          if (fromInstanceId !== THIS_INS_ID && toInstanceId !== THIS_INS_ID) {
            depGraph.addDependency(fromInstanceId, toInstanceId);
          }
        }

        if (!targetArg) {
          throw new Error(`Target arg - [${to}] not found in part [${partId}]`);
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
            fnOutputs[key].next(val);
          });
          cancelFns.push(() => sub.unsubscribe());
        });
      });

      depGraph
        .overallOrder()
        .map((name: string) => idToInstance.get(name))
        .forEach((instance: PartInstance) => {
          const inputs = instanceArgs.get(instance.id);
          const outputs = instanceOutputs.get(instance.id);

          const part = getPart(instance, repo);
          if (!inputs) {
            throw new Error(`Unexpected error - args not found when running ${instance}`);
          }

          if (!outputs) {
            throw new Error(`Unexpected error - outputs not found when running ${instance}`);
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
          // magic happens here - parts are executed
          const cancel = execute({
            part,
            inputs,
            outputs,
            partsRepo: repo,
            _debugger,
            insId: instance.id,
            extraContext,
            mainState,
            parentInsId,
            onBubbleError,
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
            throw new Error(`Unsure what to do with key ${key}, input: ${input} of ins ${parentInsId}`);
          }
        });
      });

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
