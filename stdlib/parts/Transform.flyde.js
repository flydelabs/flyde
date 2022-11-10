module.exports = {"id":"Transform","inputs":{"from":{"mode":"required","type":"any"},"to":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"customViewCode":"<% if (inputs.to) { %> to \"<%- inputs.to %>\" <% } %>","completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { to } = inputs;
const { r } = outputs;
        
// magic here
r.next(to); }}