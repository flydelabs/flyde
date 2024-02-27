import { VisualNode } from "@flyde/core";

export const defaultNode: VisualNode = {
  instances: [
    {
      id: "voixmhfp3bpsbkz4c0kcbpe0",
      macroId: "InlineValue",
      macroData: {
        type: "string",
        value: "Hello ",
        label: '"Hello "',
      },
      inputConfig: {},
      nodeId: "InlineValue__voixmhfp3bpsbkz4c0kcbpe0",
      pos: {
        x: -186.9242626953125,
        y: 266.6974755859376,
      },
    },
    {
      id: "Concat-lq03jnw",
      nodeId: "Concat",
      inputConfig: {},
      pos: {
        x: -128.57554931640624,
        y: 386.0663989257813,
      },
    },
  ],
  connections: [
    {
      from: {
        insId: "voixmhfp3bpsbkz4c0kcbpe0",
        pinId: "value",
      },
      to: {
        insId: "Concat-lq03jnw",
        pinId: "a",
      },
    },
    {
      from: {
        insId: "Concat-lq03jnw",
        pinId: "value",
      },
      to: {
        pinId: "output",
        insId: "__this",
      },
    },
    {
      from: {
        pinId: "name",
        insId: "__this",
      },
      to: {
        insId: "Concat-lq03jnw",
        pinId: "b",
      },
    },
  ],
  id: "HelloWorld",
  inputs: {
    name: {
      mode: "required",
    },
  },
  outputs: {
    output: {
      delayed: false,
    },
  },
  inputsPosition: {
    name: {
      x: -0.5913024902343764,
      y: 170.6619384765625,
    },
  },
  outputsPosition: {
    result: {
      x: -54.8432216607452,
      y: 551.2245043827568,
    },
    output: {
      x: -85.68895530332333,
      y: 564.1598071171318,
    },
  },
} as VisualNode;
