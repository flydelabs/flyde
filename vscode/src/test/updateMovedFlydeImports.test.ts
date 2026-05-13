import assert = require("assert");
import * as path from "path";
import { updateFlydeImportsForRenamedFiles } from "../flydeImportPathUpdater";

const flowWithImport = (importPath: string) => `imports:
  "${importPath}": ChildFlow
node:
  id: ParentFlow
  inputs: {}
  outputs: {}
  instances: []
  connections: []
  inputsPosition: {}
  outputsPosition: {}
`;

suite("updateMovedFlydeImportsForRenamedFiles", () => {
  test("updates imports that point at a moved flow", () => {
    const projectRoot = path.resolve("/project");
    const parentPath = path.join(projectRoot, "Parent.flyde");
    const oldChildPath = path.join(projectRoot, "nested", "Child.flyde");
    const newChildPath = path.join(projectRoot, "shared", "Child.flyde");

    const result = updateFlydeImportsForRenamedFiles(
      flowWithImport("./nested/Child.flyde"),
      parentPath,
      [{ oldPath: oldChildPath, newPath: newChildPath }]
    );

    assert.equal(result.changed, true);
    assert.match(result.contents, /\.\/shared\/Child\.flyde/);
  });

  test("keeps imports valid when the importing flow is moved", () => {
    const projectRoot = path.resolve("/project");
    const oldParentPath = path.join(projectRoot, "Parent.flyde");
    const newParentPath = path.join(projectRoot, "moved", "Parent.flyde");

    const result = updateFlydeImportsForRenamedFiles(
      flowWithImport("./Child.flyde"),
      newParentPath,
      [{ oldPath: oldParentPath, newPath: newParentPath }]
    );

    assert.equal(result.changed, true);
    assert.match(result.contents, /\.\.\/Child\.flyde/);
  });
});
