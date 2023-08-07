import * as allExported from "../src/all";
import { writeFileSync } from "fs";
import { isCodeNode, isVisualNode, Node } from "@flyde/core";

const nodes = Object.fromEntries(
  Object.entries(allExported).filter(
    ([_, value]: [string, unknown]) =>
      isCodeNode(value as Node) || isVisualNode(value as Node)
  )
);

writeFileSync("dist/nodes.json", JSON.stringify(nodes));
