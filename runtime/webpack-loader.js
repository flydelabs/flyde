const { readFileSync } = require("fs");
const { resolveFlow, deserializeFlow } = require("@flyde/resolver");

const {relative, dirname} = require('path');


module.exports = async function loader() {

  const contents = readFileSync(this.resourcePath, 'utf-8');

  const resolved = await resolveFlow(this.resourcePath, "implementation");
  const raw = await deserializeFlow(contents, this.resourcePath);

  const originalFlowFolder = dirname(this.resourcePath);
  resolved.dependencies = Object.entries(resolved.dependencies).reduce((acc, [key, part]) => {

        if (typeof part.fn === "function") {
          const requirePath = relative(originalFlowFolder, part.source.path);
          if (part.source.export === "default") {
            part.fn = `___require('./${requirePath}').fn___`;
          } else {
            part.fn = `___require('./${requirePath}').${part.source.export}.fn___`;
          }
          return { ...acc, [key]: part };
        }
        return acc;
  }, []);

  const output = {resolvedFlow: resolved, flow: raw};

  const stringified = JSON.stringify(output);

  // webpack loaders expect a string to be returned, therefore we need to stringify the object and do some magic with the requires
  const transformed = stringified.replace(/['"]___require\(('.*?')\)\.(.*?)\.?fn___['"]/g, (match, p1, p2) => {
    return `require(${p1})${p2 ? `.${p2}` : ''}.fn`;
  });

  return `export default ${transformed}`;
};
