module.exports = {"id":"CollectionInsertOne","inputs":{"collectionName":{"mode":"required","type":"any"},"item":{"mode":"required","type":"any"}},"outputs":{"success":{"type":"any"}},"completionOutputs":["success"],"fn":function (inputs, outputs, adv) { // magic here
mongoDb.collection(inputs.collectionName)
    .insertOne(inputs.item)
    .then(res => outputs.success.next({...inputs.item, _id: res.insertedId}))
    .catch((e) => adv.onError(e));
 }}