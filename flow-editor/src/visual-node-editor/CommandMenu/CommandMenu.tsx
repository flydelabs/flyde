import React, { useCallback, useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
} from "@flyde/ui";
import { ImportableEditorNode, NodeLibraryGroup } from "@flyde/core";
import { cn } from "@flyde/ui";
import { usePorts } from "@/flow-editor/ports";
import { NodeItem, CustomNodeButton } from "./CommandMenuNodeItem";
import { useCommandMenuData } from "./useCommandMenuData";

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNode: (node: ImportableEditorNode) => void;
  onClickCustomNode: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  open,
  onOpenChange,
  onAddNode,
  onClickCustomNode,
}) => {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<NodeLibraryGroup[]>([]);

  const { getLibraryData } = usePorts();

  useEffect(() => {
    getLibraryData().then((data) => {
      setGroups(data.groups);
    });
  }, [getLibraryData]);

  const {
    nodeMap,
    filteredGroups,
    updateRecentlyUsed,
    nodeMatchesQuery
  } = useCommandMenuData({ groups, query });

  // Handler for selecting a node
  const onSelect = useCallback(
    (value: string) => {
      if (value === "custom") {
        onClickCustomNode();
        onOpenChange(false);
        return;
      }

      // Format is now "category:nodeId" but we only need the nodeId part
      const nodeId = value.split(":").pop() as string;
      const node = nodeMap[nodeId];

      if (node) {
        // Update recently used nodes
        updateRecentlyUsed(nodeId);
        onAddNode(node);
      }

      onOpenChange(false);
    },
    [nodeMap, onAddNode, onClickCustomNode, onOpenChange, updateRecentlyUsed]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="[&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-1 [&_[cmdk-group]]:px-1 [&_[cmdk-item]]:py-1 ">
        <CommandInput
          placeholder="Search nodes..."
          value={query}
          onValueChange={setQuery}
          className="h-7"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {filteredGroups.map((group) => (
            <React.Fragment key={group.title}>
              <CommandGroup heading={group.title} className="pb-0.5">
                <div className={cn("grid gap-0", query ? "" : "grid-cols-4")}>
                  {group.title === "Essentials" &&
                    (!query ||
                      "Custom Node"
                        .toLowerCase()
                        .includes(query.toLowerCase())) && (
                      <CustomNodeButton onSelect={onSelect} />
                    )}
                  {group.nodes.map((node) => (
                    <NodeItem
                      key={node.id}
                      node={node}
                      groupTitle={group.title}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </CommandGroup>
              <CommandSeparator className="my-0.5" />
            </React.Fragment>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
