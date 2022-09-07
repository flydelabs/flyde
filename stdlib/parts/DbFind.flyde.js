module.exports = {"id":"DbFind","inputs":{"query":{"mode":"required","type":"any"},"sort":{"mode":"required-if-connected","type":"any"},"limit":{"mode":"required-if-connected","type":"any"},"skip":{"mode":"required-if-connected","type":"any"}},"outputs":{"res":{"type":"any"},"err":{"type":"any"}},"fn":function (inputs, outputs, adv) { // magic here
const {query, sort, limit, skip} = inputs;
db.find(query, sort || {}, Math.min(limit, 1000), {}, skip)
    .then(d => outputs.res.next(d))
    .catch(err => outputs.err.next(err.toString()));
 }}