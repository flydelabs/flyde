module.exports = {"id":"SpreadListDelayed","inputs":{"list":{"mode":"required","type":"any"}},"outputs":{"val":{"type":"any"},"idx":{"type":"any"},"length":{"type":"any"}},"fn":function (inputs, outputs, adv) { // magic here
const { list } = inputs;
const { val, idx, length } = outputs;
length.next(list.length);
list.forEach((v, i) => {
    setTimeout(() => {
        val.next(v);
        idx.next(i);
    }, 100 * idx);
}); }}