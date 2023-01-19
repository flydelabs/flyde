import { partFromSimpleFunction } from "./utils/partFromSimpleFunction";

const namespace = 'Console';

export const Log = partFromSimpleFunction({
    id: 'Log',
    icon: 'fa-terminal',
    namespace,
    description: 'Logs a value to the console',
    inputs: [{name: 'value', description: 'Value to log'}],
    fn: (value) => console.log(value)
});

export const Error = partFromSimpleFunction({
    id: 'Error',
    icon: 'fa-terminal',
    namespace,
    description: 'Logs an error to the console',
    inputs: [{name: 'value', description: 'Value to log'}],
    fn: (value) => console.error(value)
});
    