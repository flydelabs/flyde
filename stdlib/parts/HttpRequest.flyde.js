module.exports = {"id":"HttpRequest","inputs":{"url":{"mode":"required","type":"any"},"method":{"mode":"required","type":"any"},"headers":{"mode":"required-if-connected","type":"any"},"data":{"mode":"required-if-connected","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"fn":function (inputs, outputs, adv) { const { url, headers, method, data } = inputs;
const { r } = outputs;

const {onError} = adv;
        
// magic here
axios({ url, method, data, headers, timeout: DEFAULT_AXIOS_TIMEOUT }).then((res) => {
    r.next(res.data);
}, (err) => {
    onError(err);
}); }}