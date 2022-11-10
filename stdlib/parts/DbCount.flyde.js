module.exports = {"id":"DbCount","inputs":{"query":{"mode":"required","type":"any"}},"outputs":{"count":{"type":"any"}},"completionOutputs":["count"],"fn":function (inputs, outputs, adv) { // magic here
const {query} = inputs;

const {onError} = adv;

db.count(query)
    .then(d => outputs.count.next(d))
    .catch(err => {
        onError(err);
    });
 }}