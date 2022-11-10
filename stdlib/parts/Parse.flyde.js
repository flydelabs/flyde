module.exports = {"id":"Parse","inputs":{"str":{"mode":"required","type":"any"}},"outputs":{"obj":{"type":"any"},"e":{"type":"any"}},"fn":function (inputs, outputs, adv) { const { str } = inputs;
const { obj, e } = outputs;
        
// magic here
try {
    obj.next(JSON.parse(str));
} catch (err) {
    console.error("error parsing json", err, str);
    e.next({str, e});
} }}