import {
  codeNodeInstance,
  CodeNodeInstance,
  FlydeFlow,
  InlineNodeInstance,
  VisualNode,
  visualNodeInstance,
  VisualNodeInstance,
  VisualNodeSource,
  VisualNodeSourceInline,
} from "@flyde/core";

function migrateVisualNode(
  node: VisualNode,
  imports: [string, string[]][]
): VisualNode {
  const migratedNode = { ...node };

  for (const instance of migratedNode.instances) {
    const anyIns = instance as any;

    if ((anyIns as CodeNodeInstance | VisualNodeInstance).source) {
      continue;
    }

    const importedNodeId = anyIns.macroId ?? anyIns.nodeId;
    const importedNodeImport = imports.find(([pkg, nodeIds]) =>
      nodeIds.includes(importedNodeId)
    );

    if (!importedNodeImport) {
      throw new Error(
        `processing instance [${anyIns.id}] with imported id [${importedNodeId}] but it is not found in the imports`
      );
    }

    const importSource = importedNodeImport[0];

    const isCodeImport =
      importSource.endsWith(".flyde.ts") ||
      importSource.endsWith(".flyde.js") ||
      !importSource.endsWith(".flyde");

    if (isCodeImport) {
      const newInstance = codeNodeInstance(
        anyIns.id,
        importedNodeId,
        {
          type: importSource.endsWith(".flyde.ts") ? "file" : "package",
          data: importedNodeImport[0],
        },
        anyIns.macroData,
        instance.inputConfig,
        instance.pos
      );

      delete anyIns.macroId;
      delete anyIns.macroData;
      anyIns.nodeId = newInstance.nodeId;
      anyIns.source = newInstance.source;
      anyIns.config = newInstance.config;
      anyIns.inputConfig = newInstance.inputConfig;
      anyIns.pos = newInstance.pos;

      console.info("Migrated", anyIns.id, "to new format");
    } else {
      // visual node

      const isInline = !!(anyIns as InlineNodeInstance).node;

      if (isInline) {
        const inlineNode = (anyIns as InlineNodeInstance).node;
        const migratedInlineNode = migrateVisualNode(inlineNode, imports);

        const source: VisualNodeSource = {
          type: "inline",
          data: migratedInlineNode,
        };

        const newInstance = visualNodeInstance(
          anyIns.id,
          importedNodeId,
          source,
          instance.inputConfig,
          instance.pos
        );

        delete anyIns.macroId;
        delete anyIns.macroData;
        delete anyIns.node;
        anyIns.nodeId = newInstance.nodeId;
        anyIns.source = newInstance.source;
        anyIns.inputConfig = newInstance.inputConfig;
        anyIns.pos = newInstance.pos;
      } else {
        const source: VisualNodeSource = {
          type: importSource.endsWith(".flyde") ? "file" : "package",
          data: importSource,
        };

        const newInstance = visualNodeInstance(
          anyIns.id,
          importedNodeId,
          source,
          instance.inputConfig,
          instance.pos
        );

        delete anyIns.macroId;
        delete anyIns.macroData;
        anyIns.nodeId = newInstance.nodeId;
        anyIns.source = newInstance.source;
        anyIns.inputConfig = newInstance.inputConfig;
        anyIns.pos = newInstance.pos;
      }
    }
  }

  return migratedNode;
}

export function migrateToPR198Structure(data: {
  node?: VisualNode;
  imports?: FlydeFlow["imports"];
}) {
  if (!data.node) {
    throw new Error("node is required for 198 migration");
  }

  const { node, imports: _imports } = data;
  const imports = Object.entries(_imports ?? []).map(([key, value]) => [
    key,
    value.map(String),
  ]) as [string, string[]][];

  delete data.imports;

  const res = migrateVisualNode(node, imports);

  return res;
}
