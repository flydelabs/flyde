import { GroupedPart, groupedPart, partInstance, RefPartInstance, ResolvedFlydeFlow, ResolvedFlydeFlowDefinition } from "@flyde/core";
import { assert } from "chai";
import _ = require("lodash");
import { namespaceFlowImports } from "./namespace-flow-imports";

describe('namespace flows', () => {
    it('namespaces refered part ids and their imports', () => {
        const flow: ResolvedFlydeFlowDefinition = {
            main: groupedPart({
                id: 'Bob',
                instances: [
                    partInstance('i1', 'Alice')
                ],
            }),
            dependencies: {
                'Alice': {...groupedPart({
                        id: 'Alice',
                        instances: [
                            partInstance('i2', 'Dave')
                        ]
                }), importPath: 'bob'},
            }
        };
    
        const namespaced = namespaceFlowImports(flow, 'NS__');        

        assert.equal((namespaced.main.instances[0] as RefPartInstance).partId, 'NS__Alice')

        assert.deepEqual(_.keys(namespaced.dependencies), ['NS__Alice']);
        assert.equal(namespaced.dependencies['NS__Alice'].id, 'NS__Alice');

        assert.equal(((namespaced.dependencies['NS__Alice'] as unknown as GroupedPart).instances[0] as RefPartInstance).partId, 'NS__Dave')

    })


});