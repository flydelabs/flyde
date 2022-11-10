module.exports = {"id":"DbUpdate","inputs":{"query":{"mode":"required","type":"any"},"update":{"mode":"required","type":"any"},"options":{"mode":"optional","type":"any"}},"outputs":{"ok":{"type":"any"},"err":{"type":"any"}},"fn":function (inputs, outputs, adv) { // magic here
const {query, update, options} = inputs;
const {ok, err} = outputs;
db.update(query, update, options)
    .then((doc) => ok.next(doc))
    .catch((e) => err.next(e)); }}