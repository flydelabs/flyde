import { CodeNode, nodeInput, nodeOutput } from "@flyde/core";

export const parseHtml: CodeNode = {
  id: "parseHtml",
  inputs: {
    html: nodeInput("required"),
    selector: nodeInput("required"),
  },
  outputs: {
    parsed: nodeOutput(),
  },
  run: async (inputs, outputs) => {
    const { parse } = await import("node-html-parser");
    const { html, selector } = inputs;
    const maybeParsed = parse(html).querySelector(selector);
    if (!maybeParsed) {
      throw new Error(`Could not find element with selector ${selector}`);
    }

    outputs.parsed.next(maybeParsed);
  },
};
