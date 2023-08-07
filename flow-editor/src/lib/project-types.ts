import { partInput, partOutput, VisualNode } from "@flyde/core";

export const emptyWebUiProject: VisualNode = {
  id: "new-web-ui-project",
  inputs: {},
  outputs: {
    jsx: partOutput(),
  },
  inputsPosition: { mouse: { x: 0, y: 0 }, keyPress: { x: 200, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
  completionOutputs: [],
  reactiveInputs: [],
};

export const emptyServerProject: VisualNode = {
  id: "new-server-project",
  inputs: {
    request: partInput(),
  },
  outputs: {
    response: partOutput(),
  },
  inputsPosition: { request: { x: 0, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
};

export const emptyLambdaProject: VisualNode = {
  id: "new-lambda-project",
  inputs: {
    context: partInput(),
  },
  outputs: {
    response: partOutput(),
  },
  inputsPosition: { context: { x: 0, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
};

export const emptyMobileProject: VisualNode = {
  id: "new-mobile-project",
  inputs: {},
  outputs: {
    jsx: partOutput(),
  },
  inputsPosition: { context: { x: 0, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
};

export const emptyCliProject: VisualNode = {
  id: "new-cli-project",
  inputs: {
    args: partInput(),
  },
  outputs: {
    stdout: partOutput(true),
    stderr: partOutput(true),
    exit: partOutput(true),
  },
  inputsPosition: { args: { x: 0, y: 0 } },
  outputsPosition: {
    stdout: { x: -100, y: 400 },
    stderr: { x: 0, y: 400 },
    exit: { x: 100, y: 400 },
  },
  connections: [],
  instances: [],
};

export const typeProjectMap: { [k: string]: VisualNode } = {
  server: emptyServerProject,
  "web-ui": emptyWebUiProject,
  lambda: emptyLambdaProject,
  mobile: emptyMobileProject,
  cli: emptyCliProject,
};
