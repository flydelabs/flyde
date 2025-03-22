import React, { useCallback, useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flyde/ui";
import { ImportableEditorNode, NodeLibraryGroup } from "@flyde/core";
import { InstanceIcon } from "../instance-view";
import { cn } from "@flyde/ui";
import { useLocalStorage } from "../../lib/user-preferences";
import { usePorts } from "@/flow-editor/ports";

const RECENTLY_USED_KEY = "flyde-recently-used-nodes";
const MAX_RECENT_NODES = 8;

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
  const [importables, setImportables] = useState<ImportableEditorNode[]>();
  const [recentlyUsedIds, setRecentlyUsedIds] = useLocalStorage<string[]>(
    RECENTLY_USED_KEY,
    []
  );

  const [groups, setGroups] = useState<NodeLibraryGroup[]>([]);

  const { getLibraryData } = usePorts();

  useEffect(() => {
    getLibraryData().then((data) => {
      setGroups(data.groups);
    });
  }, [getLibraryData]);

  const filteredGroups = React.useMemo(() => {
    if (!query) {
      // Remove nodes that appear in Essentials from other categories
      const essentialsNodes = new Set(
        groups.find((g) => g.title === "Essentials")?.nodes.map((n) => n.id) ||
          []
      );

      return groups.map((group) => {
        if (group.title === "Essentials") return group;
        return {
          ...group,
          nodes: group.nodes.filter((node) => !essentialsNodes.has(node.id)),
        };
      });
    }

    const customNodeMatches = "Custom Node"
      .toLowerCase()
      .includes(query.toLowerCase());

    // First filter the nodes in each group
    const filteredGroups = groups.map((group) => ({
      ...group,
      nodes: group.nodes.filter((node) => {
        const searchContent = `${node.id} ${node.displayName ?? ""} ${
          node.description ?? ""
        } ${node.aliases?.join(" ") ?? ""}`;
        return searchContent.toLowerCase().includes(query.toLowerCase());
      }),
    }));

    // Then filter out empty groups, but keep Essentials if customNodeMatches
    return filteredGroups.filter(
      (group) =>
        group.nodes.length > 0 ||
        (group.title === "Essentials" && customNodeMatches)
    );
  }, [groups, query]);

  const filteredImportables = React.useMemo(() => {
    if (!importables) return [];

    const allLibraryNodes = new Set(
      groups.flatMap((g) => g.nodes).map((n) => n.id)
    );

    return importables.filter((importable) => {
      if (allLibraryNodes.has(importable.id)) return false;

      if (!query) return true;

      const content = `${importable.aliases?.join(" ") ?? ""} ${
        importable.id
      } ${importable.displayName ?? ""} ${importable.description ?? ""}`;
      return content.toLowerCase().includes(query.toLowerCase());
    });
  }, [importables, query, groups]);

  // Get recently used nodes from current available nodes
  const recentlyUsedNodes = React.useMemo(() => {
    const allNodes = [
      ...groups.flatMap((g) => g.nodes.map((node) => node)),
      ...(importables || []),
    ];

    return recentlyUsedIds
      .map((id) => allNodes.find((node) => node.id === id))
      .filter(Boolean) as ImportableEditorNode[];
  }, [recentlyUsedIds, groups, importables]);

  const onSelect = useCallback(
    (value: string) => {
      if (value === "custom") {
        onClickCustomNode();
        onOpenChange(false);
        return;
      }

      const [source, nodeId] = value.split(":");
      if (source === "library") {
        const node = groups
          .flatMap((g) => g.nodes)
          .find((n) => n.id === nodeId);
        if (node) {
          setRecentlyUsedIds(
            [nodeId, ...recentlyUsedIds.filter((id) => id !== nodeId)].slice(
              0,
              MAX_RECENT_NODES
            )
          );
          onAddNode(node);
        }
      } else if (source === "importable") {
        const node = importables?.find((i) => i.id === nodeId);
        if (node) {
          setRecentlyUsedIds(
            [nodeId, ...recentlyUsedIds.filter((id) => id !== nodeId)].slice(
              0,
              MAX_RECENT_NODES
            )
          );
          onAddNode(node);
        }
      }
      onOpenChange(false);
    },
    [
      groups,
      importables,
      onAddNode,
      onClickCustomNode,
      onOpenChange,
      recentlyUsedIds,
      setRecentlyUsedIds,
    ]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="[&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-1 [&_[cmdk-group]]:px-1 [&_[cmdk-item]]:py-1">
        <CommandInput
          placeholder="Search nodes..."
          value={query}
          onValueChange={setQuery}
          className="h-7"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {!query && recentlyUsedNodes.length > 0 && (
            <React.Fragment>
              <CommandGroup heading="Recently Used" className="pb-0.5">
                <div className="grid grid-cols-4 gap-0">
                  {recentlyUsedNodes.map((importable) => (
                    <CommandItem
                      key={importable.id}
                      value={`importable:${importable.id}`}
                      onSelect={onSelect}
                      className="text-xs py-1 px-1 cursor-pointer add-menu-item"
                    >
                      {importable.icon && (
                        <InstanceIcon
                          icon={importable.icon}
                          className="mr-0.5"
                        />
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="truncate">
                            {importable.displayName}
                          </TooltipTrigger>
                          {importable.description &&
                            typeof importable.description === "string" && (
                              <TooltipContent
                                side="right"
                                className="max-w-[300px]"
                              >
                                {importable.description}
                              </TooltipContent>
                            )}
                        </Tooltip>
                      </TooltipProvider>
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
              <CommandSeparator className="my-0.5" />
            </React.Fragment>
          )}
          {filteredGroups.map((group) => (
            <React.Fragment key={group.title}>
              <CommandGroup heading={group.title} className="pb-0.5">
                <div className={cn("grid gap-0", query ? "" : "grid-cols-4")}>
                  {group.title === "Essentials" &&
                    (!query ||
                      "Custom Node"
                        .toLowerCase()
                        .includes(query.toLowerCase())) && (
                      <CommandItem
                        value="custom"
                        onSelect={onSelect}
                        className="text-xs py-1 px-1 cursor-pointer add-menu-item"
                      >
                        <InstanceIcon icon="cow" className="mr-0.5" />
                        Custom Node
                      </CommandItem>
                    )}
                  {group.nodes.map((node) => (
                    <CommandItem
                      key={node.id}
                      value={`library:${node.id}`}
                      onSelect={onSelect}
                      className="text-xs cursor-pointer"
                    >
                      <InstanceIcon icon={node.icon} className="mr-0.5" />

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="truncate">
                            {node.displayName ?? node.id}
                          </TooltipTrigger>
                          {node.description && (
                            <TooltipContent
                              side="right"
                              className="max-w-[300px]"
                            >
                              {node.description}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
              <CommandSeparator className="my-0.5" />
            </React.Fragment>
          ))}
          {filteredImportables.length > 0 && (
            <CommandGroup heading="All Other Nodes" className="pb-0">
              <div className={cn("grid gap-0", query ? "" : "grid-cols-4")}>
                {filteredImportables.map((importable) => (
                  <CommandItem
                    key={importable.id}
                    value={`importable:${importable.id}`}
                    onSelect={onSelect}
                    className="text-xs py-1 px-1 add-menu-item"
                  >
                    {importable.icon && (
                      <InstanceIcon
                        icon={importable.icon as string}
                        className="mr-0.5"
                      />
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="truncate">
                          {importable.displayName ?? importable.id}
                        </TooltipTrigger>
                        {importable.description &&
                          typeof importable.description === "string" && (
                            <TooltipContent
                              side="right"
                              className="max-w-[300px]"
                            >
                              {importable.description}
                            </TooltipContent>
                          )}
                      </Tooltip>
                    </TooltipProvider>
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
