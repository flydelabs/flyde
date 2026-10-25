import * as ts from "typescript";
import * as path from "path";

/**
 * Transforms ES module imports into accesses on a global __imports object.
 * Additionally, resolves relative import specifiers to absolute paths based on the
 * source file location. This ensures that after a file is moved, the import still
 * points to the correct module.
 */
export function importToGlobalTransformer(fileName?: string): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isImportDeclaration(node)) {
        // Extract the raw module specifier string (without quotes)
        let moduleName = node.moduleSpecifier.getText().slice(1, -1);
        // Resolve relative paths to absolute paths based on the file location
        if (fileName && (moduleName.startsWith("./") || moduleName.startsWith("../"))) {
          const dir = path.dirname(fileName);
          const resolved = path.resolve(dir, moduleName);
          // Use POSIX style for consistency (VS Code works with forward slashes)
          moduleName = resolved.split(path.sep).join("/");
        }
        const importClause = node.importClause;

        const declarations: ts.VariableDeclaration[] = [];

        if (importClause) {
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
                    ts.factory.createIdentifier("__imports"),
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
                const propertyName = el.propertyName ? el.propertyName.getText() : name;
                declarations.push(
                  ts.factory.createVariableDeclaration(
                    name,
                    undefined,
                    undefined,
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createElementAccessExpression(
                        ts.factory.createIdentifier("__imports"),
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
                    ts.factory.createIdentifier("__imports"),
                    ts.factory.createStringLiteral(moduleName)
                  )
                )
              );
            }
          }

          return ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(declarations, ts.NodeFlags.Const)
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
