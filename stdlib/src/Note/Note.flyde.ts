import { nodeInput, CodeNode } from "@flyde/core";

export interface NoteConfig {
  content: string;
}

export const Note: CodeNode = {
  id: "Note",
  displayName: "Note",
  defaultStyle: {
    icon: "comment",
    cssOverride: {
      padding: "6px 8px",
    },
  },
  description: "A note node for documentation purposes",
  overrideNodeBodyHtml: (config) => parseMarkdown(config.content),
  run: () => {},
  inputs: {
    never: nodeInput(), // this is a hack to make the node never trigger
  },
  outputs: {},
  mode: "advanced",
  defaultConfig: {
    content: "Enter your comment here",
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/Note.js",
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
