module.exports = {"id":"Accumulate","inputs":{"count":{"mode":"required","type":"any"},"val":{"mode":"optional","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"reactiveInputs":["val"],"fn":function (inputs, outputs, adv) { const {count, val} = inputs;
const {r} = outputs;

const {state} = adv;

let list = state.get("list") || [];

if (count !== state.get("count")) {
    list = [];
    state.set("count", count);
}

if (typeof val !== 'undefined') {
    list.push(val);
}


state.set("list", list);

if (list.length === state.get("count")) {
    r.next(list);
} }}