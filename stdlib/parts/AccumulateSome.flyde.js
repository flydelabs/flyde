module.exports = {"id":"AccumulateSome","inputs":{"count":{"mode":"required","type":"any"},"allow":{"mode":"optional","type":"any"},"filter":{"mode":"optional","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"reactiveInputs":["allow","filter"],"fn":function (inputs, outputs, adv) { const {count, allow, filter} = inputs;
const {r} = outputs;

const {state} = adv;

let allowedList = state.get("allowed-list") || [];
let filterList = state.get("filter-list") || [];

if (count !== state.get("count")) {
    state.set("count", count);
}

if (typeof allow !== 'undefined') {
    allowedList.push(allow);
}

if (typeof filter !== 'undefined') {
    filterList.push(filter);
}

state.set("allowed-list", allowedList);
state.set("filter-list", filterList);

if (allowedList.length + filterList.length === state.get("count")) {
    r.next(allowedList);
}
 }}