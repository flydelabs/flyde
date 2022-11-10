module.exports = {"id":"Round","inputs":{"n":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { n } = inputs;
const { r } = outputs;
      
// magic here
r.next(Math.round(n));
       }}