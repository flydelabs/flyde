import * as ts from 'typescript';
import * as path from 'path';
import { resolveImportPath } from './resolve-import';

/**
 * Transforms import declarations so that they remain valid after a file
 * has been moved within the workspace.
 *
 * The transformer walks the AST, finds `ImportDeclaration` nodes and rewrites
 * their module specifiers using `resolveImportPath`.
 */
export function importsTransformer(context: ts.TransformationContext) {
  const visitor: ts.Visitor = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const sourceFile = node.getSourceFile();
      const originalSpecifier = node.moduleSpecifier.text;

      const newSpecifier = resolveImportPath(originalSpecifier, sourceFile.fileName);

      // If the specifier didn't change, keep the original node.
      if (newSpecifier === originalSpecifier) {
        return ts.visitEachChild(node, visitor, context);
      }

      const updatedModuleSpecifier = ts.createStringLiteral(newSpecifier);
      const updatedImport = ts.updateImportDeclaration(
        node,
        node.decorators,
        node.modifiers,
        node.importClause,
        updatedModuleSpecifier,
        node.assertClause
      );

      return ts.visitEachChild(updatedImport, visitor, context);
    }

    return ts.visitEachChild(node, visitor, context);
  };

  return (file: ts.SourceFile) => ts.visitNode(file, visitor);
}
