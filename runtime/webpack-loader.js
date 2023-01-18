const { readFileSync } = require("fs");
const { resolveFlow, deserializeFlow } = require("@flyde/resolver");

const {relative, dirname} = require('path');


module.exports = async function loader() {

  const contents = readFileSync(this.resourcePath, 'utf-8');

  const resolved = await resolveFlow(this.resourcePath, "implementation");
  const raw = await deserializeFlow(contents, this.resourcePath);

  const originalFlowFolder = dirname(this.resourcePath);
  resolved.dependencies = Object.entries(resolved.deps).reduce((acc, [key, part]) => {
        if (typeof part.fn === "function" && mode === "bundle") {
          const requirePath = relative(originalFlowFolder, val.importPath);
          part.fn = `require('./${requirePath}').fn`;
          return { ...val, part };
        }
        return val;
      });

  const output = {resolvedFlow: resolved, flow: raw};

  return `export default ${output}`;
};
