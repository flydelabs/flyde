import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flyde/ui";
import { Button } from "@flyde/ui";
import { ImportableSource, ImportedNode, NodeLibraryData } from "@flyde/core";
import classNames from "classnames";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useDependenciesContext } from "../../flow-editor/DependenciesContext";
import { AddNodeMenu } from "./AddNodeMenu";
import { useDarkMode } from "../../flow-editor/DarkModeContext";

import { useScrollWithShadow } from "../../lib/react-utils/use-shadow-scroll";
import { InstanceIcon } from "../instance-view";
import { DragEvent } from "react";

export interface NodesLibraryProps extends NodeLibraryData {
  onAddNode: (node: ImportableSource) => void;
  onClickCustomNode: () => void;
}

export const NodesLibrary: React.FC<NodesLibraryProps> = memo((props) => {
  const { groups, onAddNode, onClickCustomNode } = props;

  const [showAddNodeMenu, setShowAddNodeMenu] = React.useState(false);

  const { onRequestImportables } = useDependenciesContext();

  const darkMode = useDarkMode();

  const [openGroup, setOpenGroup] = useState(groups[0]?.title ?? "");

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
      className={classNames("nodes-library rounded-md border bg-background", {
        dark: darkMode,
      })}
    >
      <div
        className="list overflow-auto"
        style={{ boxShadow }}
        onScroll={onScrollHandler}
      >
        {groups.map((group, idx) => (
          <div key={group.title}>
            <div
              className={classNames(
                "group-title cursor-pointer px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                {
                  "bg-accent": openGroup === group.title,
                }
              )}
              onClick={() => setOpenGroup(group.title)}
            >
              {group.title}
            </div>
            <div className="group-items space-y-1 p-1">
              {idx === 0 && (
                <div
                  className="group-item flex cursor-pointer items-center rounded-sm px-2 py-1 hover:bg-accent hover:text-accent-foreground"
                  draggable
                  onClick={onClickCustomNode}
                >
                  <InstanceIcon icon="cow" />
                  <span className="ml-2">Custom Node</span>
                </div>
              )}
              {group.nodes.map((node) => (
                <TooltipProvider key={node.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="group-item flex cursor-pointer items-center rounded-sm px-2 py-1 hover:bg-accent hover:text-accent-foreground"
                        draggable
                        onDragStart={(e) =>
                          onDragStart(e, node as ImportedNode)
                        }
                        onClick={() =>
                          onAddNode({
                            module: "@flyde/stdlib",
                            node: node as ImportedNode,
                          })
                        }
                      >
                        <div className="group-item-inner flex items-center">
                          {node.defaultStyle?.icon && (
                            <InstanceIcon
                              icon={node.defaultStyle?.icon as string}
                            />
                          )}
                          <span className="ml-2">
                            {node.displayName ?? node.id}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      {node.description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="view-all-container border-t p-2">
        <div className="view-all flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddNodeMenu(true)}
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
