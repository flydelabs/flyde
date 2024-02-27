import { AppFileType } from "@/components/AppView";
import { visualNode } from "@flyde/core";
import { defaultNode } from "./defaultNode";

const defaultCodeNodeContent = `import type { CodeNode } from "@flyde/core";

/*
 Feel free to change the content of this file to experiment with the code nodes
 You can then import any exported node here from your other visual nodes.
 
 Full API reference: https://www.flyde.dev/docs/custom-nodes/
 */

export const Add: CodeNode = {
  id: "Add",
  defaultStyle: {
    icon: "fa-plus",
  },
  description: "Emits the sum of two numbers",
  inputs: {
    n1: { description: "First number to add" },
    n2: { description: "Second number to add" },
  },
  outputs: { sum: { description: "The sum of n1 and n2" } },
  run: ({ n1, n2 }, { sum }) => sum.next(n1 + n2),
};
`;

const defaultEntryPointContent = `import {loadFlow} from '@flyde/runtime';

const execute = loadFlow('Flow1.flyde');

const result = await execute().result;`;

export function getDefaultContent(fileName: string, type: AppFileType) {
  switch (type) {
    case AppFileType.VISUAL_FLOW:
      return JSON.stringify({ node: { ...defaultNode, id: fileName } });
    case AppFileType.CODE_FLOW:
      return defaultCodeNodeContent;
    case AppFileType.ENTRY_POINT: {
      return defaultEntryPointContent;
    }
  }
}
