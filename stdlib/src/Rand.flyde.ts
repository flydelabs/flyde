import { CodePart } from "@flyde/core";

const part: CodePart = {
    id: 'Rand',
    inputs: {},
    outputs: {num: {}},
    fn: (inputs, outputs) => {
        outputs.num.next(Math.random());
    }
}

export default part;