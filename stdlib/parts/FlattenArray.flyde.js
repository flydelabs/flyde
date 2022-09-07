module.exports = {"id":"FlattenArray","inputs":{"arrayOfArrays":{"mode":"required","type":"any"},"depth":{"mode":"required-if-connected","type":"any"}},"outputs":{"array":{"type":"any"}},"completionOutputs":["array"],"fn":function (inputs, outputs, adv) { // magic here

const flattened = inputs.arrayOfArrays.flat(inputs.depth || 1);
outputs.array.next(flattened); }}