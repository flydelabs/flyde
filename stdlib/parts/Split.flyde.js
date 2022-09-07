module.exports = {"id":"Split","inputs":{"str":{"mode":"required","type":"any"},"by":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { str, by } = inputs;
const { r } = outputs;
        
// magic here
r.next(str.split(by)); }}