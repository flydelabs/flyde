import { CustomPart, GroupedPart } from "@flyde/core";


export const defaultProjectRoutePart: Omit<GroupedPart, 'id'> = {
  inputs: {
    request: {
      type: "any",
      mode: "optional"
    },
  },
  instances: [
    {
      id: "Transform-529",
      partId: "Transform",
      inputConfig: {
        to: {
          mode: "static",
          value: "Hello, Flyde!",
        },
      },
      pos: {
        x: -56.55580322265625,
        y: -31.924272460937487,
      },
    },
  ],
  connections: [
    {
      from: {
        insId: "__this",
        pinId: "request",
      },
      to: {
        insId: "Transform-529",
        pinId: "from",
      },
    },
    {
      from: {
        insId: "Transform-529",
        pinId: "r",
      },
      to: {
        pinId: "response",
        insId: "__this",
      },
    },
  ],
  outputs: {
    response: {
      type: "any",
      optional: false,
    },
  },
  inputsPosition: {
    request: {
      x: -14.963260538825683,
      y: -292.7929916428277,
    },
  },
  outputsPosition: {
    response: {
      x: -3.333330367298189,
      y: 150.6666691937489,
    },
  },
};
