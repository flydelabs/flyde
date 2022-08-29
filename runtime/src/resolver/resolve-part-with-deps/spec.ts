import { keys } from "@flyde/core";
import { assert } from "chai";
import { join } from "path";
import { resolveFlow } from "..";
import { resolvePartWithDeps } from "./resolve-part-with-deps";

const getFixturePath = (path: string) => join(__dirname, '../../../fixture', path);

describe('resolvePartWithDeps', () => {
    it('resolved a part including its direct dependencies properly', () => {
        const path = getFixturePath('a-imports-b-with-2-level-internal-transitive-dep/b.flyde')
        const flow = resolveFlow(path);
    
        const result = resolvePartWithDeps(flow, 'Add42');        

        assert.equal(keys(result).length, 2);

        assert.isDefined(result.Add42);
        assert.isDefined(result.Add42__Add3Nums);

        assert.equal(result.Add42.instances[0].partId, 'Add42__Add3Nums')
    })

    it('resolved a part including its transitive dependencies properly', () => {
        const path = getFixturePath('a-imports-b-with-2-level-internal-transitive-dep/b.flyde')
        const flow = resolveFlow(path);
    
        const result = resolvePartWithDeps(flow, 'Add42And73');        
        
        assert.equal(keys(result).length, 3);

        assert.isDefined(result.Add42And73);
        assert.isDefined(result.Add42And73__Add42);
        assert.isDefined(result.Add42And73__Add42__Add3Nums);

        assert.equal(result.Add42And73.instances[0].partId, 'Add42And73__Add42')
        assert.equal(result.Add42And73__Add42.instances[0].partId, 'Add42And73__Add42__Add3Nums')
    })

});