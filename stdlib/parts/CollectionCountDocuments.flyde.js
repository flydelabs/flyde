module.exports = {"id":"CollectionCountDocuments","inputs":{"options":{"mode":"optional","type":"any"},"collectionName":{"mode":"required","type":"any"},"filter":{"mode":"required","type":"any"},"":{"mode":"optional","type":"any"}},"outputs":{"count":{"type":"any"}},"completionOutputs":["count"],"fn":function (inputs, outputs, adv) { // magic here
mongoDb
    .collection(inputs.collectionName)
    .countDocuments(inputs.filter, inputs.options)
    .then((count) => {
        outputs.count.next(count);
    }); }}