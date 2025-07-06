"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSaveNode = generateAndSaveNode;
const core_1 = require("@flyde/core");
const loader_1 = require("@flyde/loader");
const fs_1 = require("fs");
const openai_1 = require("openai");
const path_1 = require("path");
const prompts_1 = require("./prompts");
async function generateNode(prompt, apiKey) {
    const openai = new openai_1.default({
        apiKey,
    });
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: prompts_1.generateCustomNodePrompt },
            { role: "user", content: prompt },
        ],
    });
    const code = response.choices[0].message.content;
    if (!code) {
        throw new Error("No code generated from OpenAI");
    }
    const usage = response.usage?.total_tokens ?? -1;
    console.info(`Flyde node generation used a total of ${usage} tokens`);
    const nodeId = code.match(/export const (\w+)/)?.[1];
    if (!nodeId) {
        throw new Error("Could not extract node ID from generated code");
    }
    const fileName = nodeId.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    return { code, fileName };
}
async function generateAndSaveNode(rootDir, prompt, apiKey) {
    const { fileName, code } = await generateNode(prompt, apiKey);
    let filePath = (0, path_1.join)(rootDir, `${fileName}.flyde.ts`);
    if ((0, fs_1.existsSync)(filePath)) {
        filePath = filePath.replace(/\.flyde\.ts$/, `${(0, core_1.randomInt)(9999)}.flyde.ts`);
    }
    (0, fs_1.writeFileSync)(filePath, code);
    const maybeNode = (0, loader_1.resolveCodeNodeDependencies)(filePath).nodes[0];
    if (!maybeNode) {
        throw new Error("Generated node is corrupt");
    }
    const node = {
        ...maybeNode.node,
        source: { path: filePath, export: maybeNode.exportName },
    };
    return { node, module: `./${fileName}.flyde.ts` };
}
//# sourceMappingURL=generate-node-from-prompt.js.map