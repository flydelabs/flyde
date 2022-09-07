module.exports = {"id":"SpreadList","inputs":{"list":{"mode":"required","type":"any"}},"outputs":{"length":{"type":"any"},"idx":{"type":"any"},"val":{"type":"any"}},"fn":function (inputs, outputs, adv) { // magic here
const { list } = inputs;
const { val, idx, length } = outputs;
length.next(list.length);
list.forEach((v, i) => {
    val.next(v);
    idx.next(i);
}); }}