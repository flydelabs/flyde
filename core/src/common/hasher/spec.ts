import { CodePart, connectionData, connectionNode, GroupedPart, Part, partInput, partInstance, partOutput } from "../.."
import { concisePart } from "../../test-utils"

import { produce}  from 'immer';
import { randomInt, randomPos, shuffle } from "..";
import { assert } from "chai";
import { hashFlow, hashPart } from ".";
import { groupedPart } from "../../part";
import { FlydeFlow } from "../../flow-schema";

const somePart: GroupedPart = {
    id: 'bob',
    inputs: {
        a: partInput('bob')
    },
    outputs: {
        r: partOutput('r')
    },
    connections: [
        connectionData('i2.r', 'i3.v'),
        connectionData('i3.r', 'i4.v'),
        connectionData('i4.r', 'i5.v'),
    ],
    instances: [
        partInstance('i1', 'somePart', undefined, {x: 14, y: 28}),
        partInstance('i2', 'somePart', undefined, {x: 14, y: 28}),
        partInstance('i3', 'somePart', undefined, {x: 14, y: 28})
    ],
    inputsPosition: {a: {x: 20, y: 20}},
    outputsPosition: {r: {x: 20, y: 500}}
};


describe('parts hasher', () => {

    describe('grouped part', () => {
        it('creates difference hash for different id', () => {
            const p2 = produce(somePart, d => {
                d.id = `${d.id}-${randomInt}`;
            })
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(p2);
    
            assert.notEqual(h1, h2);
        });
    
        it('creates difference hash for different instances', () => {
            const p2 = produce(somePart, d => {
                d.instances.push(partInstance('i7', 'somePart'));
            });
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(p2);
    
            assert.notEqual(h1, h2);
        })
    
        it('creates difference hash for different connections', () => {
            const p2 = produce(somePart, d => {
                d.connections.push(d.connections[0]);
            });
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(p2);
    
            assert.notEqual(h1, h2);
        })
    
        it('hashes parts disregarding i/o position', () => {
            
    
            const part2 = produce(somePart, draft => {
                draft.inputsPosition.a = randomPos();
                draft.outputsPosition.r = randomPos();
            });
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(part2);
    
            assert.equal(h1, h2);
        })
    
        it('hashes parts disregarding instance position when ignore enabled', () => {
            const part2 = produce(somePart, draft => {
                draft.instances[0].pos = randomPos();
            });
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(part2);
    
            assert.equal(h1, h2);
        })
    
        it('disregards order of instances and connections', () => {
            const part2 = produce(somePart, draft => {
                draft.instances = shuffle(draft.instances);
                draft.connections = shuffle(draft.connections);
            });
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(part2);
    
            assert.equal(h1, h2);
        });

        it('considers completion outputs', () => {
            const p2 = produce(somePart, draft => {
                draft.completionOutputs = ['bob'];
            });
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(p2);
    
            assert.notEqual(h1, h2);
        });
        
        it('considers reactive inputs', () => {
            const p2 = produce(somePart, draft => {
                draft.reactiveInputs = ['bob'];
            });
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(p2);
    
            assert.notEqual(h1, h2);
        });

        it('considers different inputs', () => {
            const p2 = produce(somePart, draft => {
                draft.inputs.bob2 = partInput('string');
            });
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(p2);
    
            assert.notEqual(h1, h2);
        });

        it('considers different outputs', () => {
            const p2 = produce(somePart, draft => {
                draft.outputs.bob2 = partInput('string');
            });
    
            const h1 = hashPart(somePart);
            const h2 = hashPart(p2);
    
            assert.notEqual(h1, h2);
        });
    })

    describe('code part', () => {
    
        const base: CodePart = {
            id: 'bob2',
            fnCode: `some codez`,
            customViewCode: 'bob',
            inputs: {},
            outputs: {}
        }

        it('considers fn code code part properly', () => {

            const p2 = produce(base, d => {
                d.fnCode = 'dbdfgfdg';
            })

            const h1 = hashPart(base);
            const h2 = hashPart(p2);
    
            assert.notEqual(h1, h2);
        });

        it('considers code view fn properly', () => {

            const p2 = produce(base, d => {
                d.customViewCode = 'dbdfgfdg';
            })

            const h1 = hashPart(base);
            const h2 = hashPart(p2);
    
            assert.notEqual(h1, h2);
        });
    })

    

})

describe('flow hasher', () => {
    it('emits same hash for same flow', () => {
        const f1: FlydeFlow = {
            imports: {
                'a': ['b'],
                'c': ['d']
            },
            part: groupedPart({id: 'bob'})
        }

        const f2: FlydeFlow = {
            imports: {
                'c': ['d'],
                'a': ['b'],
            },
            part: groupedPart({id: 'bob'})
        }

        assert.equal(hashFlow(f1), hashFlow(f2));
    })

    it('emits different hash for different part', () => {
        const f1: FlydeFlow = {
            imports: {
                'a': ['b'],
                'c': ['d']
            },
            part: groupedPart({id: 'bob'})
        }

        const f2: FlydeFlow = {
            imports: {
                'c': ['d'],
                'a': ['b'],
            },
            part: groupedPart({id: 'bob2'})
        }

        assert.notEqual(hashFlow(f1), hashFlow(f2));
    })
})