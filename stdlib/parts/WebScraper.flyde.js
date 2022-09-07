module.exports = {"id":"WebScraper","inputs":{"url":{"mode":"required","type":"any"},"config":{"mode":"required","type":"any"}},"outputs":{"result":{"type":"any"}},"completionOutputs":["result"],"fn":function (inputs, outputs, adv) { // magic here
const {onError} = adv;

scrapeIt(inputs.url, inputs.config).then(({ data, response }) => {
    outputs.result.next(data)
}, err => {
    onError(err);
}) }}