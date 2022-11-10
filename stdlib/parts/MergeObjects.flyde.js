module.exports = {"id":"MergeObjects","inputs":{"obj1":{"mode":"required","type":"any"},"obj2":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { // magic here
const {obj1, obj2} = inputs;
outputs.r.next({...obj1, ...obj2}); }}