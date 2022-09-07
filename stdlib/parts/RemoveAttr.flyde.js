module.exports = {"id":"RemoveAttr","inputs":{"obj":{"mode":"required","type":"any"},"k":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { obj, k } = inputs;
const { r } = outputs;
        
// magic here
const o = { ...obj };
delete o[k];
r.next(o);         }}