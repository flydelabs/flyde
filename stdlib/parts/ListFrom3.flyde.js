module.exports = {"id":"ListFrom3","inputs":{"item1":{"mode":"required","type":"any"},"item2":{"mode":"required","type":"any"},"item3":{"mode":"required","type":"any"}},"outputs":{"list":{"type":"any"}},"completionOutputs":["list"],"fn":function (inputs, outputs, adv) { // magic here
outputs.list.next(
    [
        inputs.item1,
        inputs.item2,
        inputs.item3
    ]
); }}