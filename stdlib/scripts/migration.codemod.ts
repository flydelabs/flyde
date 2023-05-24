import * as ts from "typescript";
import * as fs from "fs";

function visit(node: ts.Node): ts.Node {
  switch (node.kind) {
    case ts.SyntaxKind.VariableDeclaration: {
      const variableDeclaration = node as ts.VariableDeclaration;
      // Perform transformation here...
      // For example, replace 'oldName' identifiers with 'newName':
      if (
        ts.isIdentifier(variableDeclaration.name) &&
        variableDeclaration.name.text === "oldName"
      ) {
        return ts.factory.updateVariableDeclaration(
          variableDeclaration,
          ts.factory.createIdentifier("newName"),
          variableDeclaration.type,
          variableDeclaration.initializer
        );
      }
      break;
    }
    // Add more cases for other kinds of nodes you're interested in...
  }

  return ts.visitEachChild(node, visit, null);
}

function transform(file: string) {
  const sourceText = fs.readFileSync(file, "utf-8");
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  const transformedSourceFile = ts.visitNode(sourceFile, visit);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const result = printer.printFile(transformedSourceFile);

  fs.writeFileSync(file, result, "utf-8");
}

transform("path-to-your-file.ts");
