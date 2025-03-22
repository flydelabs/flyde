import * as allExported from "../src/all";
import { writeFileSync } from "fs";
import { CodeNode, isCodeNode, isVisualNode, VisualNode } from "@flyde/core";

const nodes = Object.fromEntries(
  Object.entries(allExported).filter(
    ([, value]: [string, unknown]) =>
      isCodeNode(value as CodeNode) || isVisualNode(value as VisualNode)
  )
);

writeFileSync("dist/nodes.json", JSON.stringify(nodes));
