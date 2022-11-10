module.exports = {"id":"GetItem","inputs":{"key":{"mode":"required","type":"any"},"defaultValue":{"mode":"required-if-connected","type":"any"}},"outputs":{"ok":{"type":"any"}},"completionOutputs":["ok"],"fn":function (inputs, outputs, adv) { // magic here
const {ok, err} = outputs;
const {key, defaultValue} = inputs;
const {onError} = adv;

mongoDb.collection('__KVStore').findOne({id: key})
    .then((doc) => {
        if (doc === null) {
            if (typeof defaultValue !== 'undefined') {
                ok.next(defaultValue);
            } else {
                onError(new Error('Key not found and no default value'));
            }
        } else {
            ok.next(doc.value);
        }
    })
    .catch((e) => {
        onError(e);
    }); }}