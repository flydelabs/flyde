const {
  isInlineValueNode,
  keys,
  isVisualNode,
  isInlineNodeInstance,
  isRefNodeInstance,
  flydeFlowSchema,
} = require("@flyde/core");
const { deserializeFlow, serializeFlow } = require("@flyde/loader");
const res = require("@flyde/loader");
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");

const files = fs.readdirSync("./parts").filter((f) => f.endsWith(".flyde"));

for (const f of files) {
  const flowPath = path.join("./parts", f);

  const d = yaml.parse(fs.readFileSync(flowPath, "utf8"));

  console.log("processindg", f);
  const { imports, parts } = d;

  if (parts) {
    const [firstId, ...more] = Object.keys(parts);
    if (more.length > 0) {
      throw "oops more than 1";
    }

    const firstNode = parts[firstId];

    if (!isVisualNode(firstNode)) {
      throw "wat";
    }

    const deps = Array.from(
      new Set(
        firstNode.instances
          .filter((i) => isRefNodeInstance(i))
          .map((i) => i.nodeId)
      )
    );
    console.log({ deps });

    const imports = deps.reduce((acc, curr) => {
      return { ...acc, [`./${curr}.flyde`]: curr };
    }, {});

    const complete = {
      imports,
      node: firstNode,
    };

    const { success } = flydeFlowSchema.safeParse(complete);

    if (!success) {
      throw "failed validation " + file;
    }

    const flow = serializeFlow(complete);

    fs.writeFileSync("./parts/" + firstNode.id + ".flyde", flow, "utf-8");

    // const neededImports =
  }

  // console.log({imports});

  // const deser = deserializeFlow(fs.readFileSync(flowPath, 'utf-8'), flowPath);

  // const firstNode = deser.parts[Object.keys(deser.parts)[0]];

  // if (isInlineValueNode(firstNode)) {
  //     if (Object.keys(deser.parts) > 1) {
  //         throw new Error('many parts in ' + f)
  //     }

  //     const {fnCode, ...node} = firstNode;

  //     node.run = "__FN_HERE__"

  //     const nodeStr = JSON.stringify(node).replace('"__FN_HERE__"', `function (inputs, outputs, adv) { ${fnCode} }`);

  //     const template = `module.exports = ${nodeStr}`

  //     fs.writeFileSync('./parts/' + firstNode.id + '.flyde.js', template, 'utf-8');
  //     fs.rmSync(flowPath)
  // }
  // console.log(deser);
}

// console.log({files});
