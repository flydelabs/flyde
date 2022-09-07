module.exports = {"id":"FirstSecondRest","inputs":{"list":{"mode":"required","type":"any"}},"outputs":{"i0":{"type":"any"},"i1":{"type":"any"},"i2":{"type":"any"},"i3":{"type":"any"},"i4":{"type":"any"},"rest":{"type":"any"}},"fn":function (inputs, outputs, adv) { const { list } = inputs;
const { i0, i1, i2, i3, i4, rest } = outputs;
      
const [_i0, _i1, _i2, _i3, _i4, _i5, ...r] = list;

[i0, i1, i2, i3, i4].forEach((o, idx) => {
    if (typeof list[idx] !== 'undefined') {
        o.next(list[idx]);
    }
});

r.length && rest.next(r)
       }}