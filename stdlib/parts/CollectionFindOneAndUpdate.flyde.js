module.exports = {"id":"CollectionFindOneAndUpdate","inputs":{"options":{"mode":"optional","type":"any"},"collectionName":{"mode":"required","type":"any"},"filter":{"mode":"required","type":"any"},"update":{"mode":"required","type":"any"}},"outputs":{"updatedItem":{"type":"any"}},"completionOutputs":["updatedItem"],"fn":function (inputs, outputs, adv) { // magic here
const options = inputs.options || {returnDocument: 'after'};
mongoDb
    .collection(inputs.collectionName)
    .findOneAndUpdate(inputs.filter, inputs.update, options)
    .then((doc) => {
        outputs.updatedItem.next(doc);
    }); }}