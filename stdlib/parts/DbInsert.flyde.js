module.exports = {"id":"DbInsert","inputs":{"doc":{"mode":"required","type":"any"}},"outputs":{"ok":{"type":"any"},"err":{"type":"any"}},"fn":function (inputs, outputs, adv) { // magic here
log('Going to insert doc')
const {onError} = adv;

db.insert(inputs.doc)
    .then((doc) => {
        log('Inserted doc')
        outputs.ok.next(doc)
    }, (err) => {
        log('Failed to insert doc')
        outputs.err.next(err);
        onError(err);
    });
 }}