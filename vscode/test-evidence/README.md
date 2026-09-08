# File rename validation for #112

[Short demonstration](rename-imports.mp4) recorded from an actual VS Code 1.135.0 Extension Development Host on Windows. It shows a local node moving into `nodes/`, the importer reference updating, and an unsaved editor note surviving. This used a minimal validation extension registering the compiled `registerFlowImportRenames` from this patch; it is not a claim that the complete Flyde visual editor was exercised. `result.json` records the integration assertions, including moving the importer into `flows/` and checking its rebased reference.

Reproduce the behavior after loading the extension:

1. Open a workspace containing `Main.flyde` with a node instance whose source is `{type: file, data: "./Node.flyde.ts"}`, and a sibling `Node.flyde.ts`.
2. Open `Main.flyde` as text and add an unsaved comment. Move the node file into a `nodes` subdirectory using Explorer. Its reference must change to `./nodes/Node.flyde.ts` and the comment must remain.
3. Move `Main.flyde` into a `flows` subdirectory. Its reference must change to `../nodes/Node.flyde.ts`.

The regression tests in `src/test/flowImportEdits.test.ts` cover modern code/visual sources, legacy imports, nested inline nodes, file/folder/importer moves, batch moves, Windows drive casing, comments/config preservation, and invalid YAML. After compiling the extension, run them independently from `vscode/` with `pnpm exec mocha --ui tdd out/test/flowImportEdits.test.js`.

Scope: rename events initiated through VS Code; files moved by an external shell are not intercepted. Malformed YAML is skipped and reported to the Flyde output channel. Local scalar file sources are updated without reserializing unrelated YAML.
