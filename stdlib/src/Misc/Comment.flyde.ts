import { MacroNode, nodeInput } from "@flyde/core";

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
        cssOverride: {
          fontSize: "10px",
          borderRadius: "0",
          fontFamily: "monospace",
          minHeight: "40px",
          padding: "6px 8px",
          textAlign: "left",
          fontWeight: "normal",
          display: "inline-flex",
          alignItems: "center",
        },
      },

      displayName: config.content,
      description: "Comment node",
      inputs: {
        never: nodeInput(), // this is a hack to make the node never trigger
      },
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
