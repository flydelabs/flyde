module.exports = {"id":"Repeat","inputs":{"val":{"mode":"required","type":"any"},"count":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { // magic here
const {val, count} = inputs;
const {r} = outputs;

for (let i = 0; i < count; i++) {
    r.next(val);
}
 }}