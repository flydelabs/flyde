import {
  codeNodeInstance,
  CodeNodeInstance,
  FlydeFlow,
  InlineNodeInstance,
  VisualNode,
  visualNodeInstance,
  VisualNodeInstance,
  VisualNodeSource,
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

    if (!anyIns.nodeId && !anyIns.macroId && !anyIns.node) {
      console.log("instance has no nodeId or macroId", anyIns);
      throw new Error("instance has no nodeId or macroId");
    }

    console.log(
      node.id,
      "migrating instance",
      anyIns.nodeId,
      anyIns.macroId,
      anyIns.node?.id
    );


    if (anyIns.nodeId === node.id) {
      const source: VisualNodeSource = {
        type: "self",
      };

      const newInstance = visualNodeInstance(anyIns.id, node.id, source);

      delete anyIns.macroId;
      delete anyIns.macroData;
      anyIns.nodeId = newInstance.nodeId;
      anyIns.source = newInstance.source;
      anyIns.inputConfig = newInstance.inputConfig;
      anyIns.pos = newInstance.pos;
      anyIns.type = newInstance.type;
      continue;
    }

    if (anyIns.node) {
      const inlineNode = (anyIns as InlineNodeInstance).node;
      const migratedInlineNode = migrateVisualNode(inlineNode, imports);

      console.log("migratedInlineNode", migratedInlineNode);

      const source: VisualNodeSource = {
        type: "inline",
        data: migratedInlineNode,
      };

      const newInstance = visualNodeInstance(
        anyIns.id,
        node.id,
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
      anyIns.type = newInstance.type;
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
          type:
            importSource.endsWith(".flyde.ts") ||
              importSource.endsWith(".flyde.js")
              ? "file"
              : "package",
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
      anyIns.type = newInstance.type;

      console.info("Migrated", anyIns.id, "to new format");
      continue;
    } else {
      // visual node

      const isInline = !!(anyIns as InlineNodeInstance).node;

      if (isInline) {
        throw new Error("impossible state");
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
        anyIns.type = newInstance.type;
        continue;
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
