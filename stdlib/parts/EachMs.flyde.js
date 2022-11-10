module.exports = {"id":"EachMs","inputs":{"ms":{"mode":"required","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["never"],"fn":function (inputs, outputs, adv) { const { ms } = inputs;
const { r } = outputs;
        
// magic here
const s = setInterval(() => {
    r.next();
}, ms);

adv.onCleanup(() => {
    clearInterval(s);
})         }}