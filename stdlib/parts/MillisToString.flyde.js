module.exports = {"id":"MillisToString","inputs":{"ms":{"mode":"required","type":"any"},"locale":{"mode":"required-if-connected","type":"any"},"options":{"mode":"required-if-connected","type":"any"}},"outputs":{"dateString":{"type":"any"}},"completionOutputs":["dateString"],"fn":function (inputs, outputs, adv) { // magic here

const {ms, locale, options} = inputs;
const {dateString} = outputs;

const _locale = locale || 'en-US';
const _options = options || {};

const str = new Date(ms).toLocaleString(_locale, _options);

dateString.next(str); }}