module.exports = {"id":"CollectionDeleteOne","inputs":{"collectionName":{"mode":"required","type":"any"},"filter":{"mode":"required","type":"any"},"options":{"mode":"optional","type":"any"}},"outputs":{"result":{"type":"any"}},"completionOutputs":["result"],"fn":function (inputs, outputs, adv) { mongoDb.collection(inputs.collectionName)
    .deleteOne(inputs.filter, inputs.options)
    .then(res => {
        outputs.result.next(res);
    })
    .catch((e) => adv.onError(e)); }}