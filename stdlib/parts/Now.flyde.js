module.exports = {"id":"Now","inputs":{"trigger":{"mode":"optional","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { trigger } = inputs;
const { r } = outputs;
        
// magic here
r.next(Date.now());
         }}