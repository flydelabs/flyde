# File moves and flow references

Moving or renaming files through VS Code's Explorer now updates the current
flow format's `source: { type: file, data: ... }` references in `.flyde` documents.
It also rebases a flow's outgoing references when that flow itself moves.
Folder moves and multiple renames in one operation use the original paths;
package sources are left alone. YAML comments and unsaved document edits are
preserved. Invalid/unreadable flows are skipped with a warning.

This participates in `workspace.onWillRenameFiles`, so the text edits are part
of VS Code's rename operation. Renames performed externally (for example, by a
shell or a Git checkout) do not generate that event and are outside this patch.
The handler does not migrate legacy `imports` documents into the current format.

## Demonstration

[Short animated test walkthrough](file-move-demo.mp4)

The video illustrates the recorded extension-host results; it is not a screen
recording of the full Flyde webview. To reproduce interactively, import a child
flow in a parent flow, rename the child in Explorer, then inspect the parent's
file source. Moving the parent into a subdirectory should rebase its relative
path. Moving their common folder should leave their relative relationship intact.

## Validation

- TypeScript 5.5.4 strict compilation of both new modules and their tests.
- 12 Mocha path-remapping tests (including swaps, folder boundaries, nested
  inline nodes, package references, comments, absolute paths and invalid YAML).
- Four tests run in an actual isolated VS Code 1.87.2 extension host using
  `WorkspaceEdit.renameFile`: target move, parent move, folder move and a dirty
  parent document. All four passed.
- YAML dependency uses the existing lockfile's 2.8.0 resolution.

The repository extension-test runner discovers the new `*.test.ts` files after
compilation. In a fully installed workspace, run the existing VS Code test
workflow (`pnpm --filter flyde-vscode test`, including its normal pretest build).
Validation here compiled the new modules separately and loaded their real event
handler in a small isolated extension host; the full workspace/webview build
was not run because dependency resolution encountered connection resets.
No full-editor visual or external-file-watcher behavior is claimed.

This is an AI-assisted contribution. No private credentials or backend
configuration are included.
