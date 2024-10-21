import * as ts from "typescript";

export function exportToGlobalTransformer(
  filename: string
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      if (
        ts.isVariableStatement(node) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        const declarations = node.declarationList.declarations;

        return ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                ts.factory.createIdentifier("__exports"),
                undefined,
                undefined,
                ts.factory.createObjectLiteralExpression(
                  declarations.map((declaration) => {
                    const name = (declaration.name as ts.Identifier).text;
                    const initializer = declaration.initializer;

                    if (!initializer) {
                      console.warn(
                        `Initializer is undefined for declaration: ${name}`
                      );
                      return ts.factory.createShorthandPropertyAssignment(name);
                    }

                    return ts.factory.createPropertyAssignment(
                      name,
                      initializer
                    );
                  })
                )
              ),
            ],
            ts.NodeFlags.Const
          )
        );
      }

      // Handle default export assignments
      if (ts.isExportAssignment(node)) {
        const expression = node.expression;

        if (!expression) {
          console.warn("Expression is undefined for export assignment");
          return node; // Skip transformation if expression is undefined
        }

        return ts.factory.createExpressionStatement(
          ts.factory.createAssignment(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("__exports"),
              ts.factory.createIdentifier("default")
            ),
            expression
          )
        );
      }

      try {
        return ts.visitEachChild(node, visit, context);
      } catch (e) {
        console.error("[exportToGlobalTransformer] Error", e);
        return node;
      }
    };
    return (node: ts.SourceFile) => {
      const transformedNode = ts.visitNode(node, visit) as ts.SourceFile;
      // Add a return statement for the __exports object at the end of the file
      const returnStatement = ts.factory.createReturnStatement(
        ts.factory.createIdentifier("__exports")
      );
      return ts.factory.updateSourceFile(transformedNode, [
        ...transformedNode.statements,
        returnStatement,
      ]);
    };
  };
}
