module.exports = {"id":"Random","inputs":{"trigger":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { trigger } = inputs;
const { r } = outputs;
      
r.next(Math.random());
       }}