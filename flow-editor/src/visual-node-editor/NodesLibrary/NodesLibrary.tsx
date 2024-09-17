import { Button, Tooltip } from "@blueprintjs/core";
import { ImportableSource, ImportedNode, NodeLibraryData } from "@flyde/core";
import classNames from "classnames";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useDependenciesContext } from "../../flow-editor/DependenciesContext";
import { AddNodeMenu } from "./AddNodeMenu";
import { useDarkMode } from "../../flow-editor/DarkModeContext";

import { useScrollWithShadow } from "../../lib/react-utils/use-shadow-scroll";
import { InstanceIcon } from "../instance-view";
import { usePorts } from "../../flow-editor/ports";
import { clearToast, toastMsg } from "../../toaster";
import { DragEvent } from "react";

export interface NodesLibraryProps extends NodeLibraryData {
  onAddNode: (node: ImportableSource) => void;
}

export const NodesLibrary: React.FC<NodesLibraryProps> = memo((props) => {
  const { groups, onAddNode } = props;

  const [showAddNodeMenu, setShowAddNodeMenu] = React.useState(false);

  const { onRequestImportables } = useDependenciesContext();

  const darkMode = useDarkMode();

  const [openGroup, setOpenGroup] = useState(groups[0]?.title ?? "");

  const { prompt, generateNodeFromPrompt } = usePorts();

  const _onGenerateWithAI = useCallback(async () => {
    const promptText = await prompt({
      text: "Describe the node you want to generate",
      defaultValue: "",
    });
    if (promptText) {
      const toast = toastMsg("Generating node...", "none", 0);
      const node = await generateNodeFromPrompt({ prompt: promptText });

      clearToast(toast);
      toastMsg("Node generated successfully", "success", 2000);
      if (node) {
        onAddNode(node.importableNode);
      }
    }
  }, [generateNodeFromPrompt, onAddNode, prompt]);

  useEffect(() => {
    if (groups.length) {
      setOpenGroup(groups[0].title);
    }
  }, [groups]);

  const { boxShadow, onScrollHandler } = useScrollWithShadow(darkMode);

  const onDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, node: ImportedNode) => {
      e.dataTransfer.setData("application/json", JSON.stringify(node));
    },
    []
  );

  return (
    <div
      className={classNames("nodes-library", {
        dark: darkMode,
      })}
    >
      <div className="list" style={{ boxShadow }} onScroll={onScrollHandler}>
        {groups.map((group) => (
          <div key={group.title}>
            <div
              className={classNames("group-title", {
                open: openGroup === group.title,
                selected: openGroup === group.title,
              })}
              onClick={() => setOpenGroup(group.title)}
            >
              {group.title}
            </div>
            <div className="group-items">
              {group.nodes.map((node) => (
                <div
                  key={node.id}
                  className="group-item"
                  draggable
                  onDragStart={(e) => onDragStart(e, node as ImportedNode)}
                  onClick={() =>
                    props.onAddNode({
                      module: "@flyde/stdlib",
                      node: node as ImportedNode,
                    })
                  }
                >
                  <Tooltip
                    content={node.description}
                    portalClassName="menu-tooltip"
                    compact
                    minimal
                  >
                    <div className="group-item-inner">
                      {node.defaultStyle?.icon && (
                        <InstanceIcon
                          icon={node.defaultStyle?.icon as string}
                        />
                      )}
                      {node.displayName ?? node.id}
                    </div>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="view-all-container">
        <div className="view-all">
          <Button
            minimal
            small
            onClick={() => setShowAddNodeMenu(true)}
            intent="primary"
          >
            View all
          </Button>
        </div>
      </div>
      {showAddNodeMenu ? (
        <AddNodeMenu
          onRequestImportables={onRequestImportables}
          onAddNode={props.onAddNode}
          onClose={() => setShowAddNodeMenu(false)}
        />
      ) : null}
    </div>
  );
});
