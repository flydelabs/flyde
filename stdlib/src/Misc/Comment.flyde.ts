import { MacroNode } from "@flyde/core";

export interface CommentConfig {
  content: string;
}

export const Comment: MacroNode<CommentConfig> = {
  id: "Comment",
  displayName: "Comment",
  defaultStyle: {
    icon: "comment",
  },
  description: "A comment node for documentation purposes",
  runFnBuilder: () => {
    return () => {
      // This node does nothing when run
    };
  },
  definitionBuilder: (config) => {
    return {
      defaultStyle: {
        // icon: "comment",
        cssOverride: {
          fontSize: "10px",
          borderRadius: "0",
          fontFamily: "monospace",
          minHeight: "80px",
          padding: "6px 8px",
          textAlign: "left",
          fontWeight: "normal",
          maxWidth: "100%",
        },
      },

      displayName: config.content,
      description: "",
      inputs: {},
      outputs: {},
    };
  },
  defaultData: {
    content: "Enter your comment here",
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/Comment.js",
  },
};
