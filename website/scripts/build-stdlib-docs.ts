import { writeFileSync } from "fs";
import ejs from "ejs";
import { CodeNode, Node } from "@site/../core";

import markdownTable from "markdown-table";

const data: Record<string, Node> = require("@flyde/stdlib/dist/nodes.json");

// group data object by "namespace"
const groupedData = Object.values(data).reduce((acc, node) => {
  const ns = node.namespace ?? "Misc";
  if (!acc[ns]) {
    acc[ns] = [];
  }

  if (!node.inputs || !node.outputs) {
    console.error({ node });
    throw new Error("42424");
  }

  acc[ns].push(node);
  return acc;
}, {});

const entries = Object.entries<CodeNode[]>(groupedData);

const groupAndTables = entries.map(([ns, nodes]) => {
  const rows = [
    ["Id", "Description", "Inputs", "Outputs"],
    ...nodes.map((node) => {
      if (!node.inputs || !node.outputs) {
        console.error({ node });
        throw new Error("Node is missing inputs or outputs");
      }

      return [
        `**${node.id}**`,
        node.description,
        Object.entries(node.inputs)
          .map(
            ([name, obj]) =>
              `<div><strong>${name}</strong>: ${obj.description} (${
                obj.mode ?? "required"
              })</div>`
          )
          .join("") || "*None*",
        Object.entries(node.outputs)
          .map(
            ([name, obj]) =>
              `<div><strong>${name}</strong>: ${obj.description}</div>`
          )
          .join("") || "*None*",
      ];
    }),
  ];
  const table = markdownTable(rows);

  return { ns, table };
});

(async function () {
  const contents = await ejs.renderFile(
    __dirname + "/build-stdlib-docs.template.ejs",
    { groups: groupAndTables }
  );

  writeFileSync("docs/Reference/StdLib/index.md", contents);
  console.log(`Done writing docs/Reference/StdLib/index.md`);
})();
