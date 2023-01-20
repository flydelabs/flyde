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

  acc[ns].push(part);
  return acc;
}, {});

console.log({groupedData: Object.keys(groupedData).length});

const entries = Object.entries<CodePart[]>(groupedData);
console.log(entries);

console.log(entries.map);



const groupAndTables = entries.map(([ns, parts]) => {

  const rows = [
    ["Id", "Description", "Inputs", "Outputs"],
    ...parts.map((part) => {
      return [
        `**${part.id}**`,
        part.description,
        Object.entries(part.inputs).map(([name, obj]) => `<div><strong>${name}</strong>: ${obj.description} (${obj.mode ?? 'required'}) ${obj.defaultValue ? `Default value - ${obj.defaultValue}` : ''}</div>`).join("") ?? '*None*',
        Object.entries(part.outputs).map(([name, obj]) => `<div><strong>${name}</strong>: ${obj.description}</div>`).join("") ?? '*None*',
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
})();
