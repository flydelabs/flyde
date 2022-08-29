import { CustomPart, CustomPartRepo, FlydeFlow, isCodePart, PartRepo } from "@flyde/core";
import { serializeFlow } from "@flyde/runtime";
import { writeFileSync } from "fs";
import { join } from "path";

const stdlib = require('../src/stdlib.json').customRepo as CustomPartRepo;



export const migrateStdlib = async (targetDir: string) => {
    
    for (const partId in stdlib) {
        const part = stdlib[partId];

        // if (!isCodePart(part)) {
        //     console.log("skipping", partId);
        //     continue;
        // }

        console.log("migrating", partId);
        

        const flow: FlydeFlow = {
            exports: [part.id],
            imports: {},
            parts: {[partId]: part}
        }
        try {
            const serialized = serializeFlow(flow);
            const targetFile = join(targetDir, partId + '.flyde');
    
            console.log(`Writing ${targetFile}`);
            writeFileSync(targetFile, serialized);
            console.log(`Done writing ${targetFile}`);

        } catch (e) {
            console.log("error migrating", partId, e);
        }
    }
}