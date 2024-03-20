import * as path from "path";
import * as fs from "fs-extra";

const editorRoot = path.join(require.resolve("@flyde/editor"), "..");
const editorTarget = path.join(__dirname, "../editor-build");

fs.copySync(editorRoot, editorTarget);
