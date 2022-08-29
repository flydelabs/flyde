import { partInput, partOutput, GroupedPart } from "@flyde/core";

export const emptyWebUiProject: GroupedPart = {
  id: "new-web-ui-project",
  inputs: {},
  outputs: {
    jsx: partOutput("jsx"),
  },
  inputsPosition: { mouse: { x: 0, y: 0 }, keyPress: { x: 200, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
  completionOutputs: [],
  reactiveInputs: [],
};

export const emptyServerProject: GroupedPart = {
  id: "new-server-project",
  inputs: {
    request: partInput("any", "optional"),
  },
  outputs: {
    response: partOutput("any"),
  },
  inputsPosition: { request: { x: 0, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
};

export const emptyLambdaProject: GroupedPart = {
  id: "new-lambda-project",
  inputs: {
    context: partInput("obj", "optional"),
  },
  outputs: {
    response: partOutput("any"),
  },
  inputsPosition: { context: { x: 0, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
};

export const emptyMobileProject: GroupedPart = {
  id: "new-mobile-project",
  inputs: {},
  outputs: {
    jsx: partOutput("jsx"),
  },
  inputsPosition: { context: { x: 0, y: 0 } },
  outputsPosition: { response: { x: 0, y: 400 } },
  connections: [],
  instances: [],
};

export const emptyCliProject: GroupedPart = {
  id: "new-cli-project",
  inputs: {
    args: partInput("list", "optional"),
  },
  outputs: {
    stdout: partOutput("any", true),
    stderr: partOutput("any", true),
    exit: partOutput("number", true),
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

export const typeProjectMap: { [k: string]: GroupedPart } = {
  server: emptyServerProject,
  "web-ui": emptyWebUiProject,
  lambda: emptyLambdaProject,
  mobile: emptyMobileProject,
  cli: emptyCliProject,
};
