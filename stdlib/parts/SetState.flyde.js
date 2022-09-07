module.exports = {"id":"SetState","inputs":{"key":{"mode":"required","type":"any"},"value":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"fn":function (inputs, outputs, adv) { const {state} = adv;
const {key, value} = inputs;

state.set(key, value);
outputs.r.next(value);

 }}