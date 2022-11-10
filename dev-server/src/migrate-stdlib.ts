// import { CustomPart, CustomPartRepo, FlydeFlow, isCodePart, PartRepo } from "@flyde/core";
// import { serializeFlow } from "@flyde/resolver";
// import { writeFileSync } from "fs";
// import { join } from "path";

// const stdlib = require('../src/stdlib.json').customRepo as CustomPartRepo;

// export const migrateStdlib = async (targetDir: string) => {

//     for (const partId in stdlib) {
//         const part = stdlib[partId];

//         console.log("migrating", partId);

//         const flow: FlydeFlow = {
//             imports: {},
//             part
//         }
//         try {
//             const serialized = serializeFlow(flow);
//             const targetFile = join(targetDir, partId + '.flyde');

//             console.log(`Writing ${targetFile}`);
//             writeFileSync(targetFile, serialized);
//             console.log(`Done writing ${targetFile}`);

//         } catch (e) {
//             console.log("error migrating", partId, e);
//         }
//     }
// }
