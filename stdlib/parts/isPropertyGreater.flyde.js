module.exports = {"id":"isPropertyGreater","inputs":{"obj":{"mode":"required","type":"any"},"key":{"mode":"required","type":"any"},"value":{"mode":"required","type":"any"}},"outputs":{"true":{"type":"any"},"false":{"type":"any"}},"customViewCode":"<% if (inputs.key && inputs.value) { %>  .<%- inputs.key %> > <%- inputs.value %> <% } else { %> Is Property Greater <% } %>","fn":function (inputs, outputs, adv) { const objVal = inputs.obj[inputs.key];

if (objVal > inputs.value) {
    outputs.true.next(inputs.obj)
} else {
    outputs.false.next(inputs.obj)
} }}