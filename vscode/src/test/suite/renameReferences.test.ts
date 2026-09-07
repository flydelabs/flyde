import { strict as assert } from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
  prepareRenameReferences,
  registerRenameReferences,
} from "../../renameReferences";

suite("File rename references", () => {
  const uri = vscode.Uri.file("/p/Consumer.flyde");
  const contents =
    "node:\n  instances:\n    - source: {type: file, data: ./Producer.flyde}\n";
  const renames = [
    {
      oldUri: vscode.Uri.file("/p/Producer.flyde"),
      newUri: vscode.Uri.file("/p/New.flyde"),
    },
  ];
  const output = { appendLine: sinon.spy() } as unknown as vscode.OutputChannel;
  const document = (text = contents) =>
    ({
      uri,
      version: 1,
      isDirty: true,
      getText: () => text,
      positionAt: (offset: number) => {
        const lines = text.slice(0, offset).split("\n");
        return new vscode.Position(
          lines.length - 1,
          lines[lines.length - 1]!.length
        );
      },
    } as vscode.TextDocument);

  teardown(() => sinon.restore());

  test("uses unsaved document contents and pre-rename URIs", async () => {
    sinon.stub(vscode.workspace, "findFiles").resolves([uri]);
    const open = sinon
      .stub(vscode.workspace, "openTextDocument")
      .resolves(document());
    const edit = await prepareRenameReferences(renames, output);
    assert.equal(open.callCount, 1);
    assert.equal(edit.entries()[0]![0].toString(), uri.toString());
    assert.equal(edit.get(uri)[0]!.newText, '"./New.flyde"');
    assert.equal(edit.get(uri)[0]!.range.start.line, 2);
    assert.equal(edit.get(uri)[0]!.range.start.character, 33);
  });

  test("rebases a moved consumer before its URI changes", async () => {
    sinon.stub(vscode.workspace, "findFiles").resolves([uri]);
    sinon.stub(vscode.workspace, "openTextDocument").resolves(document());
    const edit = await prepareRenameReferences(
      [{ oldUri: uri, newUri: vscode.Uri.file("/p/sub/Consumer.flyde") }],
      output
    );
    assert.equal(edit.get(uri)[0]!.newText, '"../Producer.flyde"');
  });

  test("skips malformed documents without rewriting them", async () => {
    sinon.stub(vscode.workspace, "findFiles").resolves([uri]);
    sinon
      .stub(vscode.workspace, "openTextDocument")
      .resolves(document("node: ["));
    assert.equal((await prepareRenameReferences(renames, output)).size, 0);
  });

  test("does not apply local renames to a different filesystem authority", async () => {
    sinon
      .stub(vscode.workspace, "findFiles")
      .resolves([vscode.Uri.parse("vscode-remote://other/p/Consumer.flyde")]);
    const open = sinon.stub(vscode.workspace, "openTextDocument");
    assert.equal((await prepareRenameReferences(renames, output)).size, 0);
    assert.equal(open.callCount, 0);
  });

  test("rejects an edit if a document changes while scanning another file", async () => {
    const doc = document();
    sinon
      .stub(vscode.workspace, "findFiles")
      .resolves([uri, vscode.Uri.file("/p/Other.flyde")]);
    const open = sinon.stub(vscode.workspace, "openTextDocument");
    open.onFirstCall().resolves(doc);
    open.onSecondCall().callsFake(async () => {
      Object.defineProperty(doc, "version", { value: 2 });
      return document();
    });
    await assert.rejects(
      prepareRenameReferences(renames, output),
      /flow changed/
    );
  });

  test("registers waitUntil synchronously and exposes disposal", async () => {
    sinon.stub(vscode.workspace, "findFiles").resolves([]);
    let listener: ((event: vscode.FileWillRenameEvent) => unknown) | undefined;
    const disposable = { dispose: sinon.spy() };
    sinon.stub(vscode.workspace, "onWillRenameFiles").callsFake((handler) => {
      listener = handler;
      return disposable;
    });
    const registered = registerRenameReferences(output);
    let pending: Thenable<unknown> | undefined;
    listener!({
      files: renames,
      token: {} as vscode.CancellationToken,
      waitUntil: (promise: Thenable<unknown>) => {
        pending = promise;
      },
    } as vscode.FileWillRenameEvent);
    assert.ok(pending);
    await pending;
    registered.dispose();
    assert.equal(disposable.dispose.callCount, 1);
  });
});
