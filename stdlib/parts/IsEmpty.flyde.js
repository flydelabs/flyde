module.exports = {"id":"IsEmpty","inputs":{"str":{"mode":"required","type":"any"}},"outputs":{"true":{"type":"any"},"false":{"type":"any"}},"fn":function (inputs, outputs, adv) { const { str } = inputs;
        
// magic here
if (str === "") {
    outputs.true.next(str);
} else {
    outputs.false.next(str);
} }}