"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplates = getTemplates;
exports.scaffoldTemplate = scaffoldTemplate;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
function getTemplates() {
    const templatesFolder = path.join(__dirname, "..", "templates");
    return fs
        .readdirSync(templatesFolder)
        .filter((file) => fs.statSync(path.join(templatesFolder, file)).isDirectory())
        .filter((folder) => fs.existsSync(path.join(templatesFolder, folder, "meta.json")) &&
        fs.existsSync(path.join(templatesFolder, folder, "Example.flyde")))
        .map((folder) => {
        const meta = JSON.parse(fs.readFileSync(path.join(templatesFolder, folder, "meta.json"), "utf-8"));
        return { ...meta, fullPath: path.join(templatesFolder, folder) };
    })
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
function scaffoldTemplate(template, targetPath, fileName) {
    const extraFiles = fs
        .readdirSync(template.fullPath)
        .filter((file) => file !== "meta.json" &&
        file !== "Example.flyde" &&
        fs.statSync(path.join(template.fullPath, file)).isFile());
    const exampleFlow = fs.readFileSync(path.join(template.fullPath, "Example.flyde"), "utf-8");
    // process special placeholders in the example flow
    const processedExampleFlow = exampleFlow.replace(/{{targetPath}}/g, targetPath);
    fs.writeFileSync(path.join(targetPath, `${fileName}.flyde`), processedExampleFlow, "utf-8");
    extraFiles.forEach((file) => {
        const fileTargetPath = path.join(targetPath, file);
        if (fs.existsSync(fileTargetPath)) {
            vscode.window.showWarningMessage(`Template file ${path.join(path.dirname(targetPath), file)} already exists. Skipping.`);
            return;
        }
        fs.copyFileSync(path.join(template.fullPath, file), fileTargetPath);
    });
}
//# sourceMappingURL=templateUtils.js.map