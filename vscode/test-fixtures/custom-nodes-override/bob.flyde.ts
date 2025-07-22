import { CodeNode } from "@flyde/core";

export default {
    id: 'Bob2',
    inputs: {},
    outputs: {},
    run: async (inputs, context) => {
        console.log('Bob2');
        
    },  
} satisfies CodeNode;