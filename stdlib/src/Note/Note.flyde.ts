import { nodeInput, CodeNode } from "@flyde/core";

export interface NoteConfig {
  content: string;
}

export const Note: CodeNode = {
  id: "Note",
  displayName: "Note",
  icon: "comment",
  defaultStyle: {
    cssOverride: {
      padding: "6px 8px",
    },
  },
  description: "A note node for documentation purposes",
  overrideNodeBodyHtml: (config) => parseMarkdown(config.content),
  run: () => { },
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
    const fontSize = Math.max(24 - (level * 2), 12); // Decrease font size by level
    return `<h${level} style="font-weight: bold; font-size: ${fontSize}px; margin-bottom: 0.5em;">${content}</h${level}>`;
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

  // Handle unordered lists
  const ulRegex = /^[ \t]*[-*+][ \t]+(.+)$/gm;
  if (ulRegex.test(markdown)) {
    let inList = false;
    let result = "";
    const lines = markdown.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^[ \t]*[-*+][ \t]+(.+)$/);

      if (match) {
        if (!inList) {
          result += "<ul style='margin-left: 20px; margin-top: 5px; margin-bottom: 5px;'>";
          inList = true;
        }
        result += `<li>${match[1]}</li>`;
      } else {
        if (inList) {
          result += "</ul>";
          inList = false;
        }
        result += line + "\n";
      }
    }

    if (inList) {
      result += "</ul>";
    }

    markdown = result;
  }

  // Handle ordered lists
  const olRegex = /^[ \t]*(\d+)\.[ \t]+(.+)$/gm;
  if (olRegex.test(markdown)) {
    let inList = false;
    let result = "";
    const lines = markdown.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^[ \t]*(\d+)\.[ \t]+(.+)$/);

      if (match) {
        if (!inList) {
          result += "<ol style='margin-left: 20px; margin-top: 5px; margin-bottom: 5px;'>";
          inList = true;
        }
        result += `<li>${match[2]}</li>`;
      } else {
        if (inList) {
          result += "</ol>";
          inList = false;
        }
        result += line + "\n";
      }
    }

    if (inList) {
      result += "</ol>";
    }

    markdown = result;
  }

  // Replace line breaks (do this last to avoid interfering with list processing)
  markdown = markdown.replace(/\n/g, "<br>");

  return markdown;
}
