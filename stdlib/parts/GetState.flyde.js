module.exports = {"id":"GetState","inputs":{"key":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"},"err":{"type":"any"}},"fn":function (inputs, outputs, adv) { const {state} = adv;
const {key} = inputs;
const {r, err} = outputs;

const val = state.get(key);
if (typeof val !== 'undefined') {
    r.next(val);
} else {
    err.next(key);
}
 }}