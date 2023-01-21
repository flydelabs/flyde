import { writeFileSync } from "fs";
import ejs from "ejs";
import { CodePart, Part } from "@site/../core";

import markdownTable from 'markdown-table';

const data: Record<string, Part> = require("@flyde/stdlib/dist/parts.json");

// group data object by "namespace"
const groupedData = Object.values(data).reduce((acc, part) => {
  const ns = part.namespace ?? "Misc";
  if (!acc[ns]) {
    acc[ns] = [];
  }

  if (!part.inputs || !part.outputs) {
    console.error({part});
    throw new Error("42424");
  }

  acc[ns].push(part);
  return acc;
}, {});

const entries = Object.entries<CodePart[]>(groupedData);

const groupAndTables = entries.map(([ns, parts]) => {

  const rows = [
    ["Id", "Description", "Inputs", "Outputs"],
    ...parts.map((part) => {

      if (!part.inputs || !part.outputs) {
        console.error({part});
        throw new Error("Part is missing inputs or outputs");
      }

      return [
        `**${part.id}**`,
        part.description,
        Object.entries(part.inputs).map(([name, obj]) => `<div><strong>${name}</strong>: ${obj.description} (${obj.mode ?? 'required'}) ${obj.defaultValue ? `Default value - ${obj.defaultValue}` : ''}</div>`).join("") || '*None*',
        Object.entries(part.outputs).map(([name, obj]) => `<div><strong>${name}</strong>: ${obj.description}</div>`).join("") || '*None*',
      ];
    })
  ];
  const table = markdownTable(rows);

  return { ns, table };
});


(async function () {
  const contents = await ejs.renderFile(
    __dirname + "/build-stdlib-docs.template.ejs",
    { groups: groupAndTables }
  );

  writeFileSync("docs/StdLib/index.md", contents);
  console.log(`Done writing docs/StdLib/index.md`);
})();
