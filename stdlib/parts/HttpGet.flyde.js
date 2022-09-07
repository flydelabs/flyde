module.exports = {"id":"HttpGet","inputs":{"url":{"mode":"required","type":"any"},"headers":{"mode":"required-if-connected","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { url, headers } = inputs;
const { r, error } = outputs;

const {onError} = adv;
        
// magic here
axios.get(url, { headers, timeout: DEFAULT_AXIOS_TIMEOUT }).then((res) => {
    r.next(res.data);
}, (err) => {
    onError(err);
}); }}