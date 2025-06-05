import {
  CodeNode,
  nodeInput,
  nodeOutput,
} from "@flyde/core";
import { FlowcodeDb } from "../hosted-db";

export const SetValue: CodeNode = {
  id: "SetValue",
  menuDisplayName: "Set Value",
  namespace: "DB",
  icon: "database",
  inputs: {
    key: {
      defaultValue: "myKey",
      editorType: "string",
      description: "The key to set in the database",
    },
    value: {
      defaultValue: null,
      editorType: "json",
      description: "The value to store",
    },
  },
  outputs: {
    result: nodeOutput(),
  },
  completionOutputs: ["result"],
  displayName: "Set Value",
  run: async (inputs, outputs, { context, onError }) => {
    const { key, value } = inputs;
    const db = context.db as FlowcodeDb;
    try {
      await db.set(key, value);
      outputs.result.next(value);
    } catch (e) {
      onError(e);
    }
  },
};

export const GetValue: CodeNode = {
  id: "GetValue",
  menuDisplayName: "Get Value",
  namespace: "DB",
  icon: "database",
  inputs: {
    key: {
      defaultValue: "myKey",
      editorType: "string",
      description: "The key to retrieve from the database",
    },
  },
  outputs: {
    result: nodeOutput(),
  },
  completionOutputs: ["result"],
  displayName: "Get Value",
  run: async (inputs, outputs, { context, onError }) => {
    const { key } = inputs;
    const db = context.db as FlowcodeDb;
    try {
      const value = await db.get(key);
      outputs.result.next(value);
    } catch (e) {
      onError(e);
    }
  },
};

export const incrementValue: CodeNode = {
  id: "incrementValue",
  menuDisplayName: "Inc. Value",
  namespace: "DB",
  icon: "database",
  inputs: {
    key: {
      defaultValue: "myKey",
      editorType: "string",
      description: "The key to increment in the database",
    },
    incrementBy: {
      defaultValue: 1,
      editorType: "number",
      description: "Amount to increment by",
    },
  },
  outputs: {
    result: nodeOutput(),
  },
  completionOutputs: ["result"],
  displayName: "Increment Value",
  run: async (inputs, outputs, { context }) => {
    const { key, incrementBy } = inputs;
    const db = context.db as FlowcodeDb;
    const value = await db.increment(key, incrementBy);
    outputs.result.next(value);
  },
};

export const decrementValue: CodeNode = {
  id: "decrementValue",
  menuDisplayName: "Decrement Value",
  namespace: "DB",
  icon: 'database',
  inputs: {
    key: {
      defaultValue: "myKey",
      editorType: "string",
      description: "The key to decrement in the database",
    },
    decrementBy: {
      defaultValue: 1,
      editorType: "number",
      description: "Amount to decrement by",
    },
  },
  outputs: {
    result: nodeOutput(),
  },
  completionOutputs: ["result"],
  displayName: "Decrement Value",
  run: async (inputs, outputs, { context }) => {
    const { key, decrementBy } = inputs;
    const db = context.db as FlowcodeDb;
    const value = await db.decrement(key, decrementBy);
    outputs.result.next(value);
  },
};

export const pushToArray: CodeNode = {
  id: "pushToArray",
  menuDisplayName: "Push to Array",
  namespace: "DB",
  icon: 'database',
  inputs: {
    key: {
      defaultValue: "myKey",
      editorType: "string",
      description: "The array key in the database",
    },
    item: {
      description: "Item to push to the array",
    },
  },
  outputs: {
    result: nodeOutput(),
  },
  completionOutputs: ["result"],
  displayName: "Push to Array",
  run: async (inputs, outputs, { context, onError }) => {
    const { key, item } = inputs;
    const db = context.db as FlowcodeDb;
    try {
      const value = await db.pushToArray(key, item);
      outputs.result.next(value);
    } catch (e) {
      onError(e);
    }
  },
};

export const DeleteValue: CodeNode = {
  id: "DeleteValue",
  menuDisplayName: "Delete Value",
  namespace: "DB",
  icon: 'database',
  inputs: {
    key: {
      defaultValue: "myKey",
      editorType: "string",
      description: "The key to delete from the database",
    },
  },
  outputs: {
    result: nodeOutput(),
  },
  completionOutputs: ["result"],
  displayName: "Delete Value",
  run: async (inputs, outputs, { context }) => {
    const { key } = inputs;
    const db = context.db as FlowcodeDb;
    await db.delete(key);
    outputs.result.next();
  },
};

export const hasKey: CodeNode = {
  id: "hasKey",
  menuDisplayName: "Has Key",
  namespace: "DB",
  icon: 'database',
  inputs: {
    key: {
      defaultValue: "myKey",
      editorType: "string",
      description: "The key to check in the database",
    },
  },
  outputs: {
    result: nodeOutput(),
  },
  completionOutputs: ["result"],
  displayName: "Has Key",
  run: async (inputs, outputs, { context }) => {
    const { key } = inputs;
    const db = context.db as FlowcodeDb;
    const value = await db.hasKey(key);
    outputs.result.next(value);
  },
};

export const getAllKeys: CodeNode = {
  id: "getAllKeys",
  displayName: "Get All Keys",
  namespace: "DB",
  icon: 'database',
  inputs: {},
  outputs: {
    keys: nodeOutput(),
  },
  completionOutputs: ["keys"],
  run: async (inputs, outputs, { context }) => {
    const db = context.db as FlowcodeDb;
    const value = await db.getAllKeys();
    outputs.keys.next(value);
  },
};

export const libraryDbNodes: CodeNode[] = [
  GetValue,
  SetValue,
  DeleteValue,
  incrementValue,
  pushToArray,
  hasKey,
  getAllKeys,
];
