module.exports = {"id":"IsGreater","inputs":{"n1":{"mode":"required","type":"any"},"n2":{"mode":"required","type":"any"},"transform":{"mode":"required-if-connected","type":"any"}},"outputs":{"true":{"type":"any"},"false":{"type":"any"}},"customViewCode":"<% if (inputs.n2) { %>  > <%- inputs.n2 %> <% } else { %> Is Greater <% } %>","fn":function (inputs, outputs, adv) { const { n1, n2, transform} = inputs;


      
if (n1 > n2) {
      outputs.true.next(typeof transform !== 'undefined' ? transform : n1);
} else {
      outputs.false.next(typeof transform !== 'undefined' ? transform : n2);
}
// magic here
       }}