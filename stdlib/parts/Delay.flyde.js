module.exports = {"id":"Delay","inputs":{"value":{"mode":"required","type":"any"},"ms":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"customViewCode":"","completionOutputs":["r"],"fn":function (inputs, outputs, adv) { // magic here
const {value, ms} = inputs;
 const timer = setTimeout(() => {
    outputs.r.next(value);
}, ms);

adv.onCleanup(() => clearTimeout(timer)); }}