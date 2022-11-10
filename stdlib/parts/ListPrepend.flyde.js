module.exports = {"id":"ListPrepend","inputs":{"list":{"mode":"required","type":"any"},"item":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { // magic here// magic here
outputs.r.next(
    [inputs.item, ...inputs.list]
); }}