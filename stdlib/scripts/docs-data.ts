import * as allExported from "../src/all";
import { writeFileSync } from "fs";
import { isCodePart, isVisualPart, Node } from "@flyde/core";

const parts = Object.fromEntries(
  Object.entries(allExported).filter(
    ([_, value]: [string, unknown]) =>
      isCodePart(value as Node) || isVisualPart(value as Node)
  )
);

writeFileSync("dist/parts.json", JSON.stringify(parts));
