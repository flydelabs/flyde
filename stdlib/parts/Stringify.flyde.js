module.exports = {"id":"Stringify","inputs":{"obj":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { obj } = inputs;
const { r } = outputs;
        
// magic here
r.next(JSON.stringify(obj)); }}