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
    let fontSize;

    // Specific size for each heading level
    switch (level) {
      case 1: fontSize = 24; break;
      case 2: fontSize = 20; break;
      case 3: fontSize = 16; break;
      case 4: case 5: case 6: fontSize = 14; break;
      default: fontSize = 14;
    }

    // Add a special marker to indicate this line shouldn't have a <br> added
    return `<h${level} style="font-family: Inter, sans-serif; font-weight: bold; font-size: ${fontSize}px; margin-bottom: 5px;">${content}</h${level}><!--no-break-->`;
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
          result += "<ul style='margin-left: 15px; margin-top: 5px; margin-bottom: 5px;'>";
          inList = true;
        }
        result += `<li style="font-family: Inter, sans-serif; font-size: 14px;">${match[1]}</li>`;
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
          result += "<ol style='margin-left: 15px; margin-top: 5px; margin-bottom: 5px;'>";
          inList = true;
        }
        result += `<li style="font-family: Inter, sans-serif; font-size: 14px;">${match[2]}</li>`;
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
  // Skip line breaks after headings by looking for the special marker
  markdown = markdown.replace(/<!--no-break-->\n/g, '<!--no-break-->');
  markdown = markdown.replace(/\n/g, "<br>");
  markdown = markdown.replace(/<!--no-break-->/g, ''); // Clean up markers

  // Wrap any plain text in a paragraph with the correct styling
  if (!markdown.includes("<p") && markdown.length > 0) {
    markdown = `<div style="font-family: Inter, sans-serif; font-size: 14px;">${markdown}</div>`;
  }

  return markdown;
}
