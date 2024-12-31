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
          fontSize: "12px",
          borderRadius: "4px",
          fontFamily: "monospace",
          minHeight: "40px",
          padding: "6px 8px",
          textAlign: "left",
          fontWeight: "normal",
          display: "inline-flex",
          alignItems: "center",
        },
      },

      displayName: parseMarkdown(config.content),
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

function parseMarkdown(markdown: string): string {
  // Replace headers
  markdown = markdown.replace(/^(#{1,6})\s(.+)$/gm, (_, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content}</h${level}>`;
  });

  // Replace bold
  markdown = markdown.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Replace italic
  markdown = markdown.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Replace links
  markdown = markdown.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Replace code
  markdown = markdown.replace(/`(.+?)`/g, "<code>$1</code>");

  // Replace horizontal rule
  markdown = markdown.replace(/^-{3,}$/gm, "<hr>");

  // Replace strikethrough
  markdown = markdown.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Replace line breaks
  markdown = markdown.replace(/\n/g, "<br>");

  return markdown;
}
