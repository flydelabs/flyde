module.exports = {"id":"FirstSecondOnlyRest","inputs":{"list":{"mode":"required","type":"any"}},"outputs":{"i0":{"type":"any"},"i1":{"type":"any"},"rest":{"type":"any"}},"fn":function (inputs, outputs, adv) { const { list } = inputs;
const { i0, i1, rest } = outputs;
      
const [_i0, _i1, ...r] = list;

[i0, i1].forEach((o, idx) => {
    if (typeof list[idx] !== 'undefined') {
        o.next(list[idx]);
    }
});

r.length && rest.next(r)
       }}