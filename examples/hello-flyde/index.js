const {loadFlow} = require('@flyde/runtime');
const execute = loadFlow('HelloFlyde.flyde');

execute()
    .then(({message}) => console.log(message))
