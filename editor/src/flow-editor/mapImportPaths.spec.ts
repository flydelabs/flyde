import assert from "assert";
import {
  ImportPathMapper,
  mapClipboardImportPaths,
  mapImportPathsInNode,
} from "./mapImportPaths";

const mapper: ImportPathMapper = (source) =>
  source === "../lib/child.flyde" ? "../other/child.flyde" : source;

describe("mapImportPathsInNode", () => {
  it("maps duplicates, inline groups and resolved inline nodes", () => {
    const node = {
      id: "root",
      instances: [
        {
          id: "a",
          pos: { x: 1, y: 2 },
          source: { type: "file", data: "../lib/child.flyde" },
        },
        {
          id: "group",
          pos: { x: 3, y: 4 },
          source: {
            type: "inline",
            data: {
              instances: [
                {
                  id: "nested",
                  pos: { x: 5, y: 6 },
                  source: { type: "file", data: "../lib/child.flyde" },
                },
              ],
            },
          },
          node: {
            instances: [
              {
                id: "resolved",
                source: { type: "file", data: "../lib/child.flyde" },
              },
            ],
          },
        },
        {
          id: "pkg",
          source: { type: "package", data: "@flyde/nodes" },
        },
        {
          id: "fileWithResolvedNode",
          source: { type: "file", data: "../lib/other.flyde" },
          node: {
            instances: [
              {
                id: "external",
                source: { type: "file", data: "../lib/child.flyde" },
              },
            ],
          },
        },
      ],
    };

    const mapped: any = mapImportPathsInNode(node, mapper);

    assert.strictEqual(mapped.instances[0].source.data, "../other/child.flyde");
    assert.strictEqual(
      mapped.instances[1].source.data.instances[0].source.data,
      "../other/child.flyde"
    );
    assert.strictEqual(
      mapped.instances[1].node.instances[0].source.data,
      "../other/child.flyde"
    );
    assert.deepStrictEqual(mapped.instances[0].pos, { x: 1, y: 2 });
    assert.deepStrictEqual(mapped.instances[1].pos, { x: 3, y: 4 });
    assert.strictEqual(mapped.instances[2].source.data, "@flyde/nodes");
    assert.strictEqual(
      mapped.instances[3].node.instances[0].source.data,
      "../lib/child.flyde",
      "an imported flow's resolved node uses a different path base"
    );
  });

  it("returns the same node when no path is affected", () => {
    const node = {
      instances: [
        {
          id: "a",
          source: { type: "file", data: "../lib/child.flyde" },
        },
      ],
    };

    assert.strictEqual(
      mapImportPathsInNode(node, (source) => source),
      node
    );
  });
});

describe("mapClipboardImportPaths", () => {
  it("maps pasted instances but keeps connections and unrelated fields", () => {
    const clipboard = {
      instances: [
        {
          id: "a-copy",
          pos: { x: 7, y: 8 },
          source: { type: "file", data: "../lib/child.flyde" },
        },
      ],
      connections: [{ from: { insId: "a-copy" }, to: { insId: "root" } }],
    };

    const mapped: any = mapClipboardImportPaths(clipboard, mapper);

    assert.strictEqual(mapped.instances[0].source.data, "../other/child.flyde");
    assert.deepStrictEqual(mapped.instances[0].pos, { x: 7, y: 8 });
    assert.deepStrictEqual(mapped.connections, clipboard.connections);
  });
});
