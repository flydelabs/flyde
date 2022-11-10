module.exports = {"id":"FormatModel","inputs":{"template":{"mode":"required","type":"any"},"model":{"mode":"required","type":"any"},"model2":{"mode":"required-if-connected","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { template, model, model2 } = inputs;
const { r } = outputs;
        
// magic here
const combined = { ...model, ...(model2 || {}) };
  const find = (_, key) => {
    const path = key.split(".");
    let o = { ...combined };
    for (let p of path) {
      if (o && o[p]) {
        o = o[p];
      } else {
        return key;
      }
    }
    return o;
  };

const replaced = template
  .replace(/\$\{([a-zA-Z \d\.]*)\}/g, find)
  .replace(/<%=([a-zA-Z \d\.]*)%>/g, find);

r.next(replaced); }}