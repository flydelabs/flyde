module.exports = {
  "one-node-per-file": {
    meta: {
      type: "problem",
      docs: {
        description: "Enforce one Flyde node per file",
        category: "Best Practices",
        recommended: true,
      },
      fixable: null,
      schema: [],
    },

    create(context) {
      const nodeTypes = ["CodeNode", "MacroNode", "ImprovedMacroNode"];
      let nodeCount = 0;
      let nodeLocations = [];

      return {
        "ExportNamedDeclaration > VariableDeclaration"(node) {
          node.declarations.forEach((declaration) => {
            if (
              declaration.init &&
              declaration.init.type === "ObjectExpression" &&
              declaration.init.properties.some(
                (prop) => prop.key.name === "id"
              ) &&
              context
                .getSourceCode()
                .getText(declaration.init)
                .includes("CodeNode")
            ) {
              nodeCount++;
              nodeLocations.push(node.loc.start);
            }
          });
        },

        "ExportNamedDeclaration > TSTypeAliasDeclaration"(node) {
          // Count type aliases that extend node types
          if (
            node.extends &&
            node.extends.some((ext) =>
              nodeTypes.includes(context.getSourceCode().getText(ext))
            )
          ) {
            nodeCount++;
            nodeLocations.push(node.loc.start);
          }
        },

        "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator"(
          node
        ) {
          // Count variable declarations that are assigned node types
          if (
            node.id &&
            node.init &&
            node.init.type === "ObjectExpression" &&
            node.init.properties.some((prop) => prop.key.name === "id")
          ) {
            nodeCount++;
            nodeLocations.push(node.loc.start);
          }
        },

        "Program:exit"() {
          if (nodeCount > 1) {
            nodeLocations.forEach((loc) => {
              context.report({
                loc,
                message:
                  "Only one Flyde node should be defined per file. Please move additional nodes to separate files.",
              });
            });
          }
        },
      };
    },
  },
  "only-node-exports": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Ensure .flyde.ts files only export a valid node and its types",
        category: "Best Practices",
        recommended: true,
      },
      fixable: null,
      schema: [],
    },

    create(context) {
      const nodeTypes = ["CodeNode", "MacroNode", "ImprovedMacroNode"];
      const filename = context.getFilename();

      // Only apply to .flyde.ts files
      if (!filename.endsWith(".flyde.ts")) {
        return {};
      }

      let validNodeExportFound = false;
      let otherExports = [];

      return {
        ExportNamedDeclaration(node) {
          const sourceCode = context.getSourceCode();
          const text = sourceCode.getText(node);

          // Allow type exports
          if (
            node.exportKind === "type" ||
            node.declaration?.type === "TSInterfaceDeclaration" ||
            node.declaration?.type === "TSTypeAliasDeclaration"
          ) {
            return;
          }

          // Check if this is a valid node export
          const isNodeExport =
            text.includes("CodeNode") ||
            text.includes("MacroNode") ||
            text.includes("ImprovedMacroNode") ||
            text.includes("processImprovedMacro(") ||
            (node.declaration?.type === "VariableDeclaration" &&
              node.declaration.declarations.some(
                (decl) =>
                  decl.init?.type === "CallExpression" &&
                  decl.init.callee.name === "processImprovedMacro"
              ));

          if (isNodeExport) {
            validNodeExportFound = true;
          } else {
            otherExports.push(node);
          }
        },

        "Program:exit"() {
          if (!validNodeExportFound) {
            context.report({
              loc: { line: 1, column: 0 },
              message: "Flyde files must export exactly one node.",
            });
          }

          otherExports.forEach((node) => {
            context.report({
              node,
              message:
                "Flyde files should only export a node and its types. Move other exports to a separate file.",
            });
          });
        },
      };
    },
  },
};
