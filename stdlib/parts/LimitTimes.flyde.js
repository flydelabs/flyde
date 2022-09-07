module.exports = {"id":"LimitTimes","inputs":{"item":{"mode":"required","type":"any"},"times":{"mode":"required","type":"any"}},"outputs":{"ok":{"type":"any"},"breach":{"type":"any"}},"completionOutputs":["breach"],"reactiveInputs":["item"],"fn":function (inputs, outputs, adv) { // magic here
const {state} = adv;
const {item, times} = inputs;
const {ok, breach} = outputs;

let curr = state.get('val') || 0;
curr++;
state.set('val', curr);
if (curr >= times) {
    breach.next(item);
} else {
    ok.next(item);
}
 }}