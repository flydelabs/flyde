const { readFileSync } = require("fs");
const { resolveFlow, deserializeFlow } = require("@flyde/resolver");

const { relative, dirname, join } = require("path");

module.exports = async function loader() {
  const contents = readFileSync(this.resourcePath, "utf-8");

  const flow = await deserializeFlow(contents, this.resourcePath);
  let { dependencies } = await resolveFlow(
    flow,
    "implementation",
    this.resourcePath
  );

  const originalFlowFolder = dirname(this.resourcePath);
  dependencies = Object.entries(dependencies).reduce((acc, [key, node]) => {
    if (typeof node.run === "function") {
      const requirePath = relative(originalFlowFolder, node.source.path);
      if (node.source.export === "default") {
        node.run = `___require('./${requirePath}').run___`;
      } else {
        node.run = `___require('./${requirePath}').${node.source.export}.run___`;
      }
      return { ...acc, [key]: node };
    } else if (node.editorConfig) {
      return { ...acc, [key]: node };
    }
    return acc;
  }, []);

  const output = { dependencies, flow };

  const stringified = JSON.stringify(output);

  // webpack loaders expect a string to be returned, therefore we need to stringify the object and do some magic with the requires
  const transformed = stringified.replace(
    /['"]___require\(('.*?')\)\.(.*?)\.?run___['"]/g,
    (match, p1, p2) => {
      return `require(${p1})${p2 ? `.${p2}` : ""}.run`;
    }
  );

  return `export default ${transformed}`;
};
