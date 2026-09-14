import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { assert } from "chai";
import { recoverMovedFileSource } from "./recoverMovedFileSource";

/**
 * Fixtures are built on the fly in a temp dir so the spec stays hermetic:
 *   proj/
 *     package.json
 *     flows/main.flyde          (only a stub file: the flow content is irrelevant here)
 *     parts/b.flyde             (original location — removed in the "moved" case)
 *     newparts/b.flyde          (location after the user moved the file)
 */
describe("recoverMovedFileSource", () => {
  const base = join(__dirname, "../../../fixture/recover-moved-file-source-tmp");

  const B_FLOW = [
    "node:",
    "  id: AddOne",
    "  inputs:",
    "    n:",
    "      mode: required",
    "      type: number",
    "  outputs:",
    "    r:",
    "      type: number",
    "  instances: []",
    "  connections: []",
  ].join("\n");

  beforeEach(() => {
    rmSync(base, { recursive: true, force: true });
    mkdirSync(join(base, "proj/flows"), { recursive: true });
    mkdirSync(join(base, "proj/parts"), { recursive: true });
    mkdirSync(join(base, "proj/newparts"), { recursive: true });
    writeFileSync(join(base, "proj/package.json"), "{}");
    writeFileSync(join(base, "proj/flows/main.flyde"), "node:\n  id: Main\n");
    writeFileSync(join(base, "proj/parts/b.flyde"), B_FLOW);
    writeFileSync(join(base, "proj/newparts/b.flyde"), B_FLOW);
  });

  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  const flowPath = () => join(base, "proj/flows/main.flyde");

  it("returns the stored path untouched when it still resolves", () => {
    const flowDir = join(base, "proj/flows");
    const result = recoverMovedFileSource(flowPath(), "../parts/b.flyde");
    assert.equal(result, join(flowDir, "../parts/b.flyde"));
  });

  it("recovers the file after it was moved to another folder", () => {
    rmSync(join(base, "proj/parts"), { recursive: true, force: true });
    const result = recoverMovedFileSource(flowPath(), "../parts/b.flyde");
    assert.isNotNull(result);
    assert.equal(result, join(base, "proj/newparts/b.flyde"));
  });

  it("still finds a candidate when several share the basename", () => {
    rmSync(join(base, "proj/parts"), { recursive: true, force: true });
    mkdirSync(join(base, "proj/parts/deep"), { recursive: true });
    writeFileSync(join(base, "proj/parts/deep/b.flyde"), B_FLOW);
    const result = recoverMovedFileSource(flowPath(), "../parts/b.flyde");
    assert.isNotNull(result);
    assert.match(String(result), /b\.flyde$/);
  });

  it("returns null when no plausible candidate exists", () => {
    rmSync(join(base, "proj/parts"), { recursive: true, force: true });
    rmSync(join(base, "proj/newparts"), { recursive: true, force: true });
    const result = recoverMovedFileSource(flowPath(), "../parts/b.flyde");
    assert.isNull(result);
  });

  it("never descends into node_modules or .git", () => {
    rmSync(join(base, "proj/parts"), { recursive: true, force: true });
    mkdirSync(join(base, "proj/node_modules/somepkg"), { recursive: true });
    writeFileSync(join(base, "proj/node_modules/somepkg/b.flyde"), B_FLOW);
    const result = recoverMovedFileSource(flowPath(), "../parts/b.flyde");
    assert.isNull(result);
  });
});
