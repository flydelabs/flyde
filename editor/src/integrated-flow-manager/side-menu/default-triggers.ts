import {
  VisualNode,
  nodeInput,
  nodeOutput,
  RestApiTrigger,
  ScheduledTrigger,
  WebAppTrigger,
  randomInt,
} from "@flyde/core";

import cuid from "cuid";
import { defaultProjectRoutePart } from "./default-route-project";

export const triggerNodeId = () => `API Trigger ${randomInt(99999)}`;

export const routeTriggerPart = (id: string = triggerNodeId()) => {
  return {
    id,
    ...defaultProjectRoutePart,
  };
};

export const scheduledTriggerPart = (): VisualNode => {
  return {
    id: triggerNodeId(),
    inputs: {
      context: {},
    },
    instances: [],
    connections: [],
    outputs: {
      ok: {},
      error: {},
    },

    inputsPosition: {},
    outputsPosition: {},
  };
};

export const restApiTrigger = (
  path: string,
  method: any,
  nodeId: string
): RestApiTrigger => {
  return {
    id: cuid(),
    type: "rest-api",
    data: {
      path,
      method,
    },
    nodeId,
  };
};

export const webAppTrigger = (path: string, nodeId: string): WebAppTrigger => {
  return {
    id: cuid(),
    type: "web-app",
    data: {
      path,
    },
    nodeId,
  };
};

export const scheduledTrigger = (
  cronExpression: string,
  nodeId: string
): ScheduledTrigger => {
  return {
    id: cuid(),
    type: "scheduled",
    data: {
      cronExpression,
    },
    nodeId,
  };
};

export const emptyWebUiProject: VisualNode = {
  id: "new-web-ui-project",
  inputs: {
    mouse: nodeInput(),
    keyPress: nodeInput(),
  },
  outputs: {
    jsx: nodeOutput(),
  },
  inputsPosition: { mouse: { x: 0, y: 0 }, keyPress: { x: 200, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
};
