module.exports = {"id":"DbRemove","inputs":{"query":{"mode":"required","type":"any"},"options":{"mode":"required-if-connected","type":"any"}},"outputs":{"ok":{"type":"any"},"err":{"type":"any"}},"fn":function (inputs, outputs, adv) { // magic here
const {query, options} = inputs;
const {onError} = adv;

db.remove(query, typeof options !== 'undefined' ? options : {})
.then((num) => outputs.ok.next(num))
.catch((err) => {
    outputs.err.next(err)
    onError(err);
});

 }}