import * as ts from "typescript";

export function importToGlobalTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleName = node.moduleSpecifier.getText().slice(1, -1); // Remove quotes
        const importClause = node.importClause;

        const declarations: ts.VariableDeclaration[] = [];

        if (importClause) {
          // Handle default imports
          // Skip over 'import type' statements

          if (importClause.isTypeOnly) {
            return node;
          }

          if (importClause.name) {
            const defaultImportName = importClause.name.getText();
            declarations.push(
              ts.factory.createVariableDeclaration(
                defaultImportName,
                undefined,
                undefined,
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createElementAccessExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("window"),
                      ts.factory.createIdentifier("__modules")
                    ),
                    ts.factory.createStringLiteral(moduleName)
                  ),
                  ts.factory.createIdentifier("default")
                )
              )
            );
          }

          // Handle named and namespace imports
          const namedBindings = importClause.namedBindings;
          if (namedBindings) {
            if (ts.isNamedImports(namedBindings)) {
              namedBindings.elements.forEach((el) => {
                const name = el.name.getText();
                const propertyName = el.propertyName
                  ? el.propertyName.getText()
                  : name;
                declarations.push(
                  ts.factory.createVariableDeclaration(
                    name,
                    undefined,
                    undefined,
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createElementAccessExpression(
                        ts.factory.createPropertyAccessExpression(
                          ts.factory.createIdentifier("window"),
                          ts.factory.createIdentifier("__modules")
                        ),
                        ts.factory.createStringLiteral(moduleName)
                      ),
                      ts.factory.createIdentifier(propertyName)
                    )
                  )
                );
              });
            }

            // Handle namespace imports
            if (ts.isNamespaceImport(namedBindings)) {
              const name = namedBindings.name.getText();
              declarations.push(
                ts.factory.createVariableDeclaration(
                  name,
                  undefined,
                  undefined,
                  ts.factory.createElementAccessExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("window"),
                      ts.factory.createIdentifier("__modules")
                    ),
                    ts.factory.createStringLiteral(moduleName)
                  )
                )
              );
            }
          }

          return ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
              declarations,
              ts.NodeFlags.Const
            )
          );
        }
      }

      try {
        return ts.visitEachChild(node, visit, context);
      } catch (e) {
        console.warn(`[importToGlobalTransformer] Error`, e);
        return node;
      }
    };
    return (node: ts.SourceFile) => ts.visitNode(node, visit) as ts.SourceFile;
  };
}
