import { CodePart, InputMode } from "@flyde/core";

export interface SimpleFnData {
    id: string,
    description: string,
    namespace: string,
    inputs?: {name: string, description: string, mode?: InputMode}[],
    output?: {name: string, description: string},
    fn: (...args: any[]) => any,
    symbol?: string,
    icon?: string
}
  
export function partFromSimpleFunction (data: SimpleFnData): CodePart {
    return {
        id: data.id,
        description: data.description,
        namespace: data.namespace,
        inputs: data.inputs ? data.inputs.reduce((obj, {name, description, mode}) => ({...obj, [name]: {description, mode}}), {}) : {},
        outputs: data.output ? {[data.output.name]: {description: data.output.description}} : {},
        defaultStyle: {
            icon: data.icon
        },
        fn: function (inputs, outputs) {
            const args = data.inputs.map(({name}) => inputs[name]);
            const result = data.fn(...args);
            if (data.output) {
                outputs[data.output.name].next(result)
            } 
        }
    }
}