

const { isCodePart, keys } = require('@flyde/core');
const { deserializeFlow } = require('@flyde/runtime');
const res = require('@flyde/runtime');
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('./parts');

for (const f of files) {

    const flowPath = path.join('./parts', f);

    const deser = deserializeFlow(fs.readFileSync(flowPath, 'utf-8'), flowPath);

    const firstPart = deser.parts[Object.keys(deser.parts)[0]];

    if (isCodePart(firstPart)) {
        if (Object.keys(deser.parts) > 1) {
            throw new Error('many parts in ' + f)
        }

        const {fnCode, ...part} = firstPart;

        part.fn = "__FN_HERE__"

        const partStr = JSON.stringify(part).replace('"__FN_HERE__"', `function (inputs, outputs, adv) { ${fnCode} }`);

        const template = `module.exports = ${partStr}`

        fs.writeFileSync('./parts/' + firstPart.id + '.flyde.js', template, 'utf-8');
        fs.rmSync(flowPath)
    }
    console.log(deser);
}



// console.log({files});
