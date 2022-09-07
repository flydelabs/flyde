module.exports = {"id":"epochToString","inputs":{"epoch":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { // magic here

const d = new Date(inputs.epoch);
outputs.r.next(d.toLocaleString()); }}