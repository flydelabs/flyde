const { readFileSync } = require("fs");
const { resolveFlow, deserializeFlow } = require("@flyde/resolver");


module.exports = async function loader() {

  const contents = readFileSync(this.resourcePath, 'utf-8');

  const resolved = await resolveFlow(this.resourcePath, "bundle");
  const raw = await deserializeFlow(contents, this.resourcePath);

  const output = {resolvedFlow: resolved, flow: raw};

  // hack to transform serialized functions into webpack requires. TODO - find a more elegant way

  const transformedOutput = JSON.stringify(output)
    .replace(/"__BUNDLE\:\[\[(.+?)\]\]"/g, (_, p1) => {
      return `require('./${p1}')`;
    })
    .replace(/"__BUNDLE_FN\:\[\[(.+?)\]\]"/g, (_, p1) => {
      return `require('./${p1}').fn`;
    });


  return `export default ${transformedOutput}`;
};
