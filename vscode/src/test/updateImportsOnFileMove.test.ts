import {
  normalizeRelativePath,
  isRelativeImport,
  resolveTargetAfterRenames,
  updateFlydeContent,
} from "./updateImportsOnFileMove";
import * as yaml from "yaml";

describe("updateImportsOnFileMove - Flyde Issue #112", () => {
  test("normalizeRelativePath formats posix relative paths correctly", () => {
    expect(normalizeRelativePath("/workspace/flows", "/workspace/flows/helper.ts")).toBe("./helper.ts");
    expect(normalizeRelativePath("/workspace/flows", "/workspace/shared/helper.ts")).toBe("../shared/helper.ts");
  });

  test("isRelativeImport identifies relative paths", () => {
    expect(isRelativeImport("./foo.ts")).toBe(true);
    expect(isRelativeImport("../foo.ts")).toBe(true);
    expect(isRelativeImport("@flyde/nodes")).toBe(false);
    expect(isRelativeImport("axios")).toBe(false);
  });

  test("updates imports and instance paths when an imported file is moved", () => {
    const originalYaml = `
imports:
  "./helpers/Add.flyde.js":
    - Add
node:
  id: MainFlow
  instances:
    - id: ins1
      nodeId: Add
      type: code
      source:
        type: file
        data: "./helpers/Add.flyde.js"
    - id: ins2
      nodeId: InlineValue
      type: code
      source:
        type: package
        data: "@flyde/nodes"
`;
    const flydePath = "/workspace/flows/main.flyde";
    const renames = [
      {
        oldPath: "/workspace/flows/helpers/Add.flyde.js",
        newPath: "/workspace/shared/Add.flyde.js",
      },
    ];

    const { changed, content } = updateFlydeContent(
      originalYaml,
      flydePath,
      flydePath,
      renames
    );

    expect(changed).toBe(true);
    const parsed = yaml.parse(content);

    // Verify top-level imports map
    expect(parsed.imports["../shared/Add.flyde.js"]).toEqual(["Add"]);
    expect(parsed.imports["./helpers/Add.flyde.js"]).toBeUndefined();

    // Verify instance source data
    expect(parsed.node.instances[0].source.data).toBe("../shared/Add.flyde.js");

    // Package import should be untouched
    expect(parsed.node.instances[1].source.data).toBe("@flyde/nodes");
  });

  test("updates imports when the importing .flyde file itself is moved", () => {
    const originalYaml = `
imports:
  "./helpers/Add.flyde.js":
    - Add
node:
  id: MainFlow
  instances:
    - id: ins1
      nodeId: Add
      type: code
      source:
        type: file
        data: "./helpers/Add.flyde.js"
`;
    const oldFlydePath = "/workspace/flows/main.flyde";
    const newFlydePath = "/workspace/flows/nested/sub/main.flyde";
    const renames = [
      {
        oldPath: oldFlydePath,
        newPath: newFlydePath,
      },
    ];

    const { changed, content } = updateFlydeContent(
      originalYaml,
      newFlydePath,
      oldFlydePath,
      renames
    );

    expect(changed).toBe(true);
    const parsed = yaml.parse(content);

    // New path relative to /workspace/flows/nested/sub
    expect(parsed.imports["../../helpers/Add.flyde.js"]).toEqual(["Add"]);
    expect(parsed.node.instances[0].source.data).toBe("../../helpers/Add.flyde.js");
  });

  test("updates imports when an entire containing folder is moved", () => {
    const originalYaml = `
imports:
  "./components/Button.flyde":
    - Button
node:
  id: AppFlow
  instances:
    - id: btn1
      nodeId: Button
      type: visual
      source:
        type: file
        data: "./components/Button.flyde"
`;
    const flydePath = "/workspace/src/app.flyde";
    const renames = [
      {
        oldPath: "/workspace/src/components",
        newPath: "/workspace/src/ui/widgets",
      },
    ];

    const { changed, content } = updateFlydeContent(
      originalYaml,
      flydePath,
      flydePath,
      renames
    );

    expect(changed).toBe(true);
    const parsed = yaml.parse(content);

    expect(parsed.imports["./ui/widgets/Button.flyde"]).toEqual(["Button"]);
    expect(parsed.node.instances[0].source.data).toBe("./ui/widgets/Button.flyde");
  });

  test("updates nested inline instances recursively", () => {
    const originalYaml = `
imports: {}
node:
  id: ComplexFlow
  instances:
    - id: inline1
      type: inline
      source:
        type: inline
        data:
          instances:
            - id: child1
              nodeId: SubNode
              type: code
              source:
                type: file
                data: "./sub/node.js"
`;
    const flydePath = "/workspace/main.flyde";
    const renames = [
      {
        oldPath: "/workspace/sub/node.js",
        newPath: "/workspace/shared/node.js",
      },
    ];

    const { changed, content } = updateFlydeContent(
      originalYaml,
      flydePath,
      flydePath,
      renames
    );

    expect(changed).toBe(true);
    const parsed = yaml.parse(content);
    const innerInstance = parsed.node.instances[0].source.data.instances[0];
    expect(innerInstance.source.data).toBe("./shared/node.js");
  });

  test("does not change content when unrelated files are renamed", () => {
    const originalYaml = `
imports:
  "./helpers/Add.flyde.js":
    - Add
node:
  id: MainFlow
  instances:
    - id: ins1
      source:
        type: file
        data: "./helpers/Add.flyde.js"
`;
    const flydePath = "/workspace/flows/main.flyde";
    const renames = [
      {
        oldPath: "/workspace/unrelated/file.txt",
        newPath: "/workspace/unrelated/renamed.txt",
      },
    ];

    const { changed, content } = updateFlydeContent(
      originalYaml,
      flydePath,
      flydePath,
      renames
    );

    expect(changed).toBe(false);
    expect(content).toBe(originalYaml);
  });
});
