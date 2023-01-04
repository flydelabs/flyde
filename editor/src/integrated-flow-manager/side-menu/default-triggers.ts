import {
  GroupedPart,
  partInput,
  partOutput,
  RestApiTrigger,
  ScheduledTrigger,
  WebAppTrigger,
  randomInt,
} from "@flyde/core";

import cuid from "cuid";
import { defaultProjectRoutePart } from "./default-route-project";

export const triggerPartId = () => `API Trigger ${randomInt(99999)}`;

export const routeTriggerPart = (id: string = triggerPartId()) => {
  return {
    id,
    ...defaultProjectRoutePart,
  };
};

export const scheduledTriggerPart = (): GroupedPart => {
  return {
    id: triggerPartId(),
    inputs: {
      context: {
        type: "any",
      },
    },
    instances: [],
    connections: [],
    outputs: {
      ok: {
        type: "any",
        optional: false,
      },
      error: {
        type: "any",
        optional: false,
      },
    },

    inputsPosition: {},
    outputsPosition: {},
  };
};

export const restApiTrigger = (
  path: string,
  method: any,
  partId: string
): RestApiTrigger => {
  return {
    id: cuid(),
    type: "rest-api",
    data: {
      path,
      method,
    },
    partId,
  };
};

export const webAppTrigger = (path: string, partId: string): WebAppTrigger => {
  return {
    id: cuid(),
    type: "web-app",
    data: {
      path,
    },
    partId,
  };
};

export const scheduledTrigger = (
  cronExpression: string,
  partId: string
): ScheduledTrigger => {
  return {
    id: cuid(),
    type: "scheduled",
    data: {
      cronExpression,
    },
    partId,
  };
};

export const emptyWebUiProject: GroupedPart = {
  id: "new-web-ui-project",
  inputs: {
    mouse: partInput("obj", "optional"),
    keyPress: partInput("obj", "optional"),
  },
  outputs: {
    jsx: partOutput("jsx"),
  },
  inputsPosition: { mouse: { x: 0, y: 0 }, keyPress: { x: 200, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
};
