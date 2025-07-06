import { EditorNodeInstance } from "@flyde/core";

export const tempLoadingNode: EditorNodeInstance["node"] = {
    id: "loading",
    inputs: {},
    outputs: {},
    displayName: "Loading",
    editorConfig: {
      type: "structured",
      fields: [],
    },
  };