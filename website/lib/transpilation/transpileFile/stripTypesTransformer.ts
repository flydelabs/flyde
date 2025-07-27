import ts from "typescript";

export function stripTypesTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const visit: ts.Visitor = (node: ts.Node) => {
      // Strip types from variable declarations
      if (ts.isVariableDeclaration(node)) {
        // Remove the type annotation
        return ts.factory.updateVariableDeclaration(
          node,
          node.name,
          node.exclamationToken,
          undefined,
          node.initializer
        );
      }

      // Strip types from function parameters
      if (ts.isParameter(node)) {
        // Remove the type annotation
        return ts.factory.updateParameterDeclaration(
          node,
          node.modifiers,
          node.dotDotDotToken,
          node.name,
          node.questionToken, // Added the missing questionToken
          undefined, // Remove the type annotation
          node.initializer
        );
      }

      // Recursively apply this visitor to child nodes
      return ts.visitEachChild(node, visit, context);
    };

    return (node: ts.SourceFile) => ts.visitNode(node, visit) as ts.SourceFile;
  };
}
