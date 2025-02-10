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
import {
  ImportableSource,
  NodeLibraryData,
  NodeLibraryGroup,
} from "@flyde/core";
import { useDependenciesContext } from "../../flow-editor/DependenciesContext";
import { InstanceIcon } from "../instance-view";
import { LocalImportableResult } from "../../flow-editor/DependenciesContext";
import { cn } from "@flyde/ui";
import { useLocalStorage } from "../../lib/user-preferences";

const RECENTLY_USED_KEY = "flyde-recently-used-nodes";
const MAX_RECENT_NODES = 8;

export interface CommandMenuProps extends NodeLibraryData {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNode: (node: ImportableSource) => void;
  onClickCustomNode: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  groups,
  open,
  onOpenChange,
  onAddNode,
  onClickCustomNode,
}) => {
  const [query, setQuery] = useState("");
  const { onRequestImportables } = useDependenciesContext();
  const [importables, setImportables] = useState<ImportableSource[]>();
  const [recentlyUsed, setRecentlyUsed] = useLocalStorage<ImportableSource[]>(
    RECENTLY_USED_KEY,
    []
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      onRequestImportables().then(({ importables }: LocalImportableResult) => {
        setImportables(importables);
      });
    } else {
      setImportables(undefined);
    }
  }, [onRequestImportables, open]);

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

    return groups
      .map((group) => ({
        ...group,
        nodes: group.nodes.filter((node) => {
          const searchContent = `${node.id} ${node.displayName ?? ""} ${
            node.namespace ?? ""
          } ${node.description ?? ""} ${node.searchKeywords?.join(" ") ?? ""}`;
          return searchContent.toLowerCase().includes(query.toLowerCase());
        }),
      }))
      .filter(
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
      if (allLibraryNodes.has(importable.node.id)) return false;

      if (!query) return true;

      const content = `${importable.node.searchKeywords?.join(" ") ?? ""} ${
        importable.node.id
      } ${importable.node.displayName ?? ""} ${
        importable.node.namespace ?? ""
      } ${importable.node.description ?? ""}`;
      return content.toLowerCase().includes(query.toLowerCase());
    });
  }, [importables, query, groups]);

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
          const importableNode = {
            module: "@flyde/stdlib",
            node: node as any,
          };
          setRecentlyUsed(
            [
              importableNode,
              ...recentlyUsed.filter((n) => n.node.id !== node.id),
            ].slice(0, MAX_RECENT_NODES)
          );
          onAddNode(importableNode);
        }
      } else if (source === "importable") {
        const node = importables?.find((i) => i.node.id === nodeId);
        if (node) {
          const importableNode = {
            module: node.module,
            node: node.node,
          };
          setRecentlyUsed(
            [
              importableNode,
              ...recentlyUsed.filter((n) => n.node.id !== node.node.id),
            ].slice(0, MAX_RECENT_NODES)
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
      recentlyUsed,
      setRecentlyUsed,
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
          {!query && recentlyUsed.length > 0 && (
            <React.Fragment>
              <CommandGroup heading="Recently Used" className="pb-0.5">
                <div className="grid grid-cols-4 gap-0">
                  {recentlyUsed.map((importable) => (
                    <CommandItem
                      key={importable.node.id}
                      value={`importable:${importable.node.id}`}
                      onSelect={onSelect}
                      className="text-xs py-1 px-1 cursor-pointer add-menu-item"
                    >
                      {importable.node.defaultStyle?.icon && (
                        <InstanceIcon
                          icon={importable.node.defaultStyle.icon as string}
                          className="mr-0.5"
                        />
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="truncate">
                            {importable.node.displayName ?? importable.node.id}
                          </TooltipTrigger>
                          {importable.node.description && (
                            <TooltipContent
                              side="right"
                              className="max-w-[300px]"
                            >
                              {importable.node.description}
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
                      {node.defaultStyle?.icon && (
                        <InstanceIcon
                          icon={node.defaultStyle.icon as string}
                          className="mr-0.5"
                        />
                      )}
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
                    key={importable.node.id}
                    value={`importable:${importable.node.id}`}
                    onSelect={onSelect}
                    className="text-xs py-1 px-1 add-menu-item"
                  >
                    {importable.node.defaultStyle?.icon && (
                      <InstanceIcon
                        icon={importable.node.defaultStyle.icon as string}
                        className="mr-0.5"
                      />
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="truncate">
                          {importable.node.displayName ?? importable.node.id}
                        </TooltipTrigger>
                        {importable.node.description && (
                          <TooltipContent
                            side="right"
                            className="max-w-[300px]"
                          >
                            {importable.node.description}
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
