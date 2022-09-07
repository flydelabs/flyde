module.exports = {"id":"Floor","inputs":{"n":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { n } = inputs;
const { r } = outputs;
      
r.next(Math.floor(n));
       }}