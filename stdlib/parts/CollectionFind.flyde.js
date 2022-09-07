module.exports = {"id":"CollectionFind","inputs":{"options":{"mode":"optional","type":"any"},"collectionName":{"mode":"required","type":"any"},"filter":{"mode":"required","type":"any"}},"outputs":{"items":{"type":"any"}},"completionOutputs":["items"],"fn":function (inputs, outputs, adv) { // magic here
mongoDb
    .collection(inputs.collectionName)
    .find(inputs.filter, inputs.options)
    .toArray()
    .then((doc) => {
        outputs.items.next(doc);
    })
    .catch((e) => adv.onError(e)) }}