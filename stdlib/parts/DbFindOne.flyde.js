module.exports = {"id":"DbFindOne","inputs":{"query":{"mode":"required","type":"any"}},"outputs":{"res":{"type":"any"}},"completionOutputs":["res"],"fn":function (inputs, outputs, adv) { // magic here
db.findOne(inputs.query)
    .then((doc) => {
        if (typeof doc !== 'undefined') {
            outputs.res.next(doc)
        } else {
            adv.onError('Not found');
        }
    })
    .catch((err) => adv.onError(err)) }}