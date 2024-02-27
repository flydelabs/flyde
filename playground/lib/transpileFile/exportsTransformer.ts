import ts from "typescript";

export function exportToGlobalTransformer(
  filename: string
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      // Handle named exports like `export const bob = 2;`
      if (
        ts.isVariableStatement(node) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        const declarations = node.declarationList.declarations;

        return declarations.map((declaration) => {
          const name = (declaration.name as ts.Identifier).text;
          return ts.factory.createExpressionStatement(
            ts.factory.createAssignment(
              ts.factory.createElementAccessExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("window"),
                  ts.factory.createIdentifier("__modules")
                ),
                ts.factory.createStringLiteral(filename)
              ),
              ts.factory.createObjectLiteralExpression([
                ts.factory.createSpreadAssignment(
                  ts.factory.createParenthesizedExpression(
                    ts.factory.createBinaryExpression(
                      ts.factory.createElementAccessExpression(
                        ts.factory.createPropertyAccessExpression(
                          ts.factory.createIdentifier("window"),
                          ts.factory.createIdentifier("__modules")
                        ),
                        ts.factory.createStringLiteral(filename)
                      ),
                      ts.factory.createToken(
                        ts.SyntaxKind.QuestionQuestionToken
                      ),
                      ts.factory.createObjectLiteralExpression()
                    )
                  )
                ),
                ts.factory.createPropertyAssignment(
                  name,
                  declaration.initializer!
                ),
              ])
            )
          );
        });
      }

      try {
        return ts.visitEachChild(node, visit, context);
      } catch (e) {
        console.error("[exportToGlobalTransformer] Error", e);
        return node;
      }
    };
    return (node: ts.SourceFile) => ts.visitNode(node, visit) as ts.SourceFile;
  };
}
