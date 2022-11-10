module.exports = {"id":"SpreadList5","inputs":{"list":{"mode":"required","type":"any"}},"outputs":{"first":{"type":"any"},"second":{"type":"any"},"rest":{"type":"any"}},"fn":function (inputs, outputs, adv) { const { list } = inputs;
const { first, second, rest } = outputs;
      
const [f, s, r] = list;

f && first.next(f);
s && second.next(s);

r.length && rest.next(r)
       }}