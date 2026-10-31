import { assert } from "chai";
import { mergeFileImportPaths } from "./mergeFileImportPaths";

type TestInstance = {
  id: string;
  pos?: { x: number; y: number };
  source?: { type: string; data: any };
};

type TestFlow = { instances: TestInstance[] };

const flow = (instances: TestInstance[]): TestFlow => ({ instances });

describe("mergeFileImportPaths", () => {
  it("takes file import paths from disk and keeps incoming editor state", () => {
    const incoming = flow([
      {
        id: "childInst",
        pos: { x: 120, y: 40 },
        source: { type: "file", data: "../lib/child.flyde" },
      },
    ]);
    const onDisk = flow([
      {
        id: "childInst",
        pos: { x: 0, y: 0 },
        source: { type: "file", data: "../other/child.flyde" },
      },
    ]);

    const merged = mergeFileImportPaths(incoming, onDisk);

    assert.equal(merged.instances[0].source?.data, "../other/child.flyde");
    assert.deepEqual(merged.instances[0].pos, { x: 120, y: 40 });
  });

  it("leaves non-file sources and unknown instances untouched", () => {
    const incoming = flow([
      {
        id: "pkgInst",
        source: { type: "package", data: "@flyde/nodes" },
      },
      {
        id: "newInst",
        source: { type: "file", data: "./new.flyde" },
      },
    ]);
    const onDisk = flow([
      {
        id: "pkgInst",
        source: { type: "package", data: "@flyde/other" },
      },
    ]);

    const merged = mergeFileImportPaths(incoming, onDisk);

    assert.equal(merged.instances[0].source?.data, "@flyde/nodes");
    assert.equal(merged.instances[1].source?.data, "./new.flyde");
  });

  it("finds imports that were grouped into a new inline flow", () => {
    const incoming = flow([
      {
        id: "newGroup",
        source: {
          type: "inline",
          data: flow([
            {
              id: "childInst",
              source: { type: "file", data: "../lib/child.flyde" },
            },
          ]),
        },
      },
    ]);
    const onDisk = flow([
      {
        id: "childInst",
        source: { type: "file", data: "../other/child.flyde" },
      },
    ]);

    const merged = mergeFileImportPaths(incoming, onDisk);
    const inline = merged.instances[0].source?.data as TestFlow;

    assert.equal(inline.instances[0].source?.data, "../other/child.flyde");
  });

  it("does not corrupt duplicate instance ids in different scopes", () => {
    const onDisk = flow([
      {
        id: "child",
        source: { type: "file", data: "./a.flyde" },
      },
      {
        id: "inlineInst",
        source: {
          type: "inline",
          data: flow([
            {
              id: "child",
              source: { type: "file", data: "./b.flyde" },
            },
          ]),
        },
      },
    ]);

    const merged = mergeFileImportPaths(onDisk, onDisk);
    const inline = merged.instances[1].source?.data as TestFlow;

    assert.equal(merged.instances[0].source?.data, "./a.flyde");
    assert.equal(inline.instances[0].source?.data, "./b.flyde");
  });

  it("keeps paths of a new instance that reuses an id in another scope", () => {
    const incoming = flow([
      {
        id: "child",
        source: { type: "file", data: "./a.flyde" },
      },
      {
        id: "newGroup",
        source: {
          type: "inline",
          data: flow([
            {
              id: "child",
              source: { type: "file", data: "./new.flyde" },
            },
          ]),
        },
      },
    ]);
    const onDisk = flow([
      {
        id: "child",
        source: { type: "file", data: "./a.flyde" },
      },
    ]);

    const merged = mergeFileImportPaths(incoming, onDisk);
    const inline = merged.instances[1].source?.data as TestFlow;

    assert.equal(merged.instances[0].source?.data, "./a.flyde");
    assert.equal(inline.instances[0].source?.data, "./new.flyde");
  });

  it("merges file imports inside inline flows", () => {
    const incoming = flow([
      {
        id: "inlineInst",
        source: {
          type: "inline",
          data: flow([
            {
              id: "nested",
              source: { type: "file", data: "../lib/child.flyde" },
            },
          ]),
        },
      },
    ]);
    const onDisk = flow([
      {
        id: "inlineInst",
        source: {
          type: "inline",
          data: flow([
            {
              id: "nested",
              source: { type: "file", data: "../other/child.flyde" },
            },
          ]),
        },
      },
    ]);

    const merged = mergeFileImportPaths(incoming, onDisk);
    const inline = merged.instances[0].source?.data as TestFlow;

    assert.equal(inline.instances[0].source?.data, "../other/child.flyde");
  });
});
