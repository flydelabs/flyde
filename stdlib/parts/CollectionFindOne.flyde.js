module.exports = {"id":"CollectionFindOne","inputs":{"collectionName":{"mode":"required","type":"any"},"filter":{"mode":"required","type":"any"},"options":{"mode":"optional","type":"any"}},"outputs":{"item":{"type":"any"}},"completionOutputs":["item"],"fn":function (inputs, outputs, adv) { mongoDb.collection(inputs.collectionName)
    .findOne(inputs.filter, inputs.options)
    .then(res => {
        if (res === null) {
            adv.onError(new Error('not found'));
        } else {
            outputs.item.next(res);
        }
    })
    .catch((e) => adv.onError(e)); }}