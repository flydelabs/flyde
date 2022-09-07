module.exports = {"id":"SetItem","inputs":{"key":{"mode":"required","type":"any"},"value":{"mode":"required","type":"any"}},"outputs":{"ok":{"type":"any"}},"completionOutputs":["ok"],"fn":function (inputs, outputs, adv) { // magic here

const {key, value} = inputs;
mongoDb.collection('__KVStore').updateOne({id: key}, {$set: {value}}, {upsert: true})
    .then(() => outputs.ok.next(value))
    .catch((err) => adv.onError(err)); }}