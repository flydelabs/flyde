module.exports = {"id":"IsGreater bool ","inputs":{"n1":{"mode":"required","type":"any"},"n2":{"mode":"required","type":"any"},"transform":{"mode":"required-if-connected","type":"any"}},"outputs":{"result":{"type":"any"}},"customViewCode":"<% if (inputs.n2) { %>  > <%- inputs.n2 %> <% } else { %> Is Greater <% } %>","fn":function (inputs, outputs, adv) { const { n1, n2, transform} = inputs;


outputs.result.next(n1 > n2);
       }}