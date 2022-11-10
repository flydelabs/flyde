module.exports = {"id":"Switch","inputs":{"val":{"mode":"required","type":"any"},"case1":{"mode":"required","type":"any"},"case2":{"mode":"required-if-connected","type":"any"},"case3":{"mode":"required-if-connected","type":"any"},"case4":{"mode":"required-if-connected","type":"any"},"case5":{"mode":"required-if-connected","type":"any"},"transform":{"mode":"required-if-connected","type":"any"}},"outputs":{"is1":{"type":"any"},"is2":{"type":"any"},"is3":{"type":"any"},"is4":{"type":"any"},"is5":{"type":"any"},"other":{"type":"any"}},"fn":function (inputs, outputs, adv) { const { val, case1, case2, case3, case4, case5, transform } = inputs;
const { is1, is2, is3, is4, is5, other } = outputs;

const valueToRespond = typeof transform !== 'undefined' ? transform : val;
// magic here
switch (val) {
    case case1:
        is1.next(valueToRespond);
        break;
    case case2:
        is2.next(valueToRespond);
        break;
    case case3:
        is3.next(valueToRespond);
        break;
    case case4:
        is4.next(valueToRespond);
        break;
    case case4:
        is5.next(valueToRespond);
        break;
    default:
        other.next(valueToRespond);
        break;
} }}