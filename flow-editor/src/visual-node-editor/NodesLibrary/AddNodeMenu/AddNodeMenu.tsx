import { Button } from "@flyde/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@flyde/ui";
import { Input } from "@flyde/ui";
import { Alert, AlertDescription } from "@flyde/ui";
import { ScrollArea } from "@flyde/ui";
import { ImportableSource, simplePluralize } from "@flyde/core";
import React, { useCallback, useEffect } from "react";
import { LocalImportableResult } from "../../../flow-editor/DependenciesContext";
import { usePorts } from "../../../flow-editor/ports";
import { InfoTooltip } from "../../../lib/InfoTooltip";
import { Loader } from "../../../lib/loader";
import { AddNodeMenuListItem } from "./AddNodeMenuListItem";
import { AddNodeMenuResultsSummary } from "./AddNodeMenuResultsSummary";
import { HelpCircle, Search } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flyde/ui";
import { Tree, TreeNodeInfo } from "@flyde/ui";

export interface AddNodeMenuProps {
  onRequestImportables: () => Promise<LocalImportableResult>;
  onAddNode: (node: ImportableSource) => void;
  onClose: () => void;
}

export type AddNodeMenuFilter =
  | { type: "external"; module: string; namespace?: string }
  | { type: "internal"; file?: string }
  | { type: "all" };

export type AddNodeMenuFilterStructure = {
  external: { module: string; namespaces: string[] }[];
  internal: { files: string[] };
};

export const AddNodeMenu: React.FC<AddNodeMenuProps> = (props) => {
  const { onRequestImportables, onAddNode, onClose } = props;

  const [importables, setImportables] = React.useState<ImportableSource[]>();
  const [importablesErrors, setImportablesErrors] = React.useState<
    LocalImportableResult["errors"]
  >([]);
  const [openNodes, setOpenNodes] = React.useState<Set<TreeNodeInfo["id"]>>(
    new Set()
  );

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<AddNodeMenuFilter>({
    type: "all",
  });
  const [filterStructure, setFilterStructure] =
    React.useState<AddNodeMenuFilterStructure>(null);

  const [visibleImportables, setVisibleImportables] = React.useState<
    ImportableSource[] | null
  >(null);

  const [selectedNode, setSelectedNode] =
    React.useState<ImportableSource>(null);

  const onNodeExpand = useCallback(
    (node: TreeNodeInfo<AddNodeMenuFilter>) => {
      openNodes.add(node.id);
      setOpenNodes(new Set(openNodes));
    },
    [openNodes]
  );

  const onNodeCollapse = useCallback(
    (node: TreeNodeInfo<AddNodeMenuFilter>) => {
      openNodes.delete(node.id);
      setOpenNodes(new Set(openNodes));
    },
    [openNodes]
  );

  const _onAddNode = useCallback(
    (node: ImportableSource) => {
      onAddNode(node);
      onClose();
    },
    [onAddNode, onClose]
  );

  const { onInstallRuntimeRequest, reportEvent } = usePorts();

  useEffect(() => {
    reportEvent("addNodeMenuOpen", {});
  }, [reportEvent]);

  useEffect(() => {
    setVisibleImportables(
      importables
        ?.flatMap((importable) => {
          if (filter) {
            if (filter.type === "external") {
              if (
                importable.module !== filter.module || filter.namespace
                  ? importable.node.namespace !== filter.namespace
                  : false
              ) {
                return [];
              }
            } else if (filter.type === "internal") {
              if (
                !isInternal(importable) ||
                (filter.file && importable.module !== filter.file)
              ) {
                return [];
              }
            }
          }
          if (query) {
            const content = `${
              importable.node.searchKeywords?.join(" ") ?? []
            } ${importable.node.id} ${importable.node.displayName ?? ""} ${
              importable.node.namespace ?? ""
            } ${importable.node.description}`;
            const score = content.toLowerCase().indexOf(query.toLowerCase());
            if (score === -1) {
              return [];
            }
            return [{ importable, score }];
          }
          return [{ importable, score: 1 }];
        })
        .sort((a, b) => a.score - b.score)
        .map(({ importable }) => importable)
    );
  }, [importables, filter, query]);

  useEffect(() => {
    onRequestImportables().then(({ importables, errors }) => {
      setImportablesErrors(errors);
      const namespacedExternals = importables
        .filter((importable) => !isInternal(importable))
        .reduce<Record<string, string[]>>((acc, importable) => {
          acc[importable.module] ??= [];
          const namespace = importable.node.namespace ?? "";

          if (!acc[importable.module].includes(namespace)) {
            acc[importable.module].push(namespace);
          }
          return acc;
        }, {});

      const internalFiles = Array.from(
        new Set(
          importables.filter(isInternal).map((importable) => importable.module)
        )
      );

      setFilterStructure({
        external: Object.entries(namespacedExternals).map(
          ([module, namespaces]) => ({ module, namespaces })
        ),
        internal: { files: internalFiles },
      });
      setImportables(importables);
      setOpenNodes(new Set(["internal", ...Object.keys(namespacedExternals)]));
    });
  }, [onRequestImportables]);

  const onSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp": {
          e.preventDefault();

          if (visibleImportables && !selectedNode) {
            setSelectedNode(
              visibleImportables[
                e.key === "ArrowDown" ? 0 : visibleImportables.length - 1
              ]
            );
            return;
          }

          if (visibleImportables && selectedNode) {
            const index = visibleImportables.findIndex(
              (p) => p === selectedNode
            );
            let nextIndex = e.key === "ArrowDown" ? index + 1 : index - 1;
            nextIndex =
              nextIndex < 0 ? visibleImportables.length - 1 : nextIndex;
            nextIndex = nextIndex >= visibleImportables.length ? 0 : nextIndex;
            setSelectedNode(visibleImportables[nextIndex]);
          }
          break;
        }
        case "Enter": {
          if (selectedNode) {
            _onAddNode(selectedNode);
          }
          break;
        }
      }
    },
    [visibleImportables, selectedNode, _onAddNode]
  );

  const onNodeClick = useCallback(
    (node: TreeNodeInfo<AddNodeMenuFilter>) => {
      if (JSON.stringify(node.nodeData) === JSON.stringify(filter)) {
        if (node.nodeData.type === "external") {
          if (node.nodeData.namespace) {
            setFilter({ type: "external", module: node.nodeData.module });
          } else {
            setFilter({ type: "all" });
          }
        } else if (node.nodeData.type === "internal") {
          if (node.nodeData.file) {
            setFilter({ type: "internal" });
          } else {
            setFilter({ type: "all" });
          }
        }
      } else {
        setFilter(node.nodeData);
      }
    },
    [filter]
  );

  const stdLibInstalled = importables
    ? importables.some((importable) =>
        importable.module.includes(`@flyde/stdlib`)
      )
    : true;

  const onInstallRuntime = useCallback(() => {
    onInstallRuntimeRequest();
    onClose();
  }, [onClose, onInstallRuntimeRequest]);

  function renderItems() {
    if (!visibleImportables) {
      return <Loader />;
    }
    if (visibleImportables.length === 0) {
      return (
        <div className="space-y-4">
          <AddNodeMenuResultsSummary
            filter={filter}
            onChangeFilter={setFilter}
            query={query}
            onChangeQuery={setQuery}
            resultsCount={visibleImportables.length}
          />
          <Alert>
            <AlertDescription>
              Can't find a suitable node? Create one yourself!{" "}
              <a
                href="https://www.flyde.dev/docs/code-nodes"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Learn more
              </a>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <React.Fragment>
        <AddNodeMenuResultsSummary
          filter={filter}
          onChangeFilter={setFilter}
          query={query}
          onChangeQuery={setQuery}
          resultsCount={visibleImportables.length}
        />
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-2">
            {visibleImportables.map((importableNode) => (
              <AddNodeMenuListItem
                importableNode={importableNode}
                key={
                  importableNode.node.id +
                  importableNode.node.namespace +
                  importableNode.module
                }
                onAdd={_onAddNode}
                selected={selectedNode?.node === importableNode.node}
                onSelect={setSelectedNode}
                onSetFilter={setFilter}
              />
            ))}
          </div>
        </ScrollArea>
      </React.Fragment>
    );
  }

  function renderContent() {
    if (!importables) {
      return <Loader />;
    }

    return (
      <div className="flex">
        <aside className="w-64 border-r p-4">
          <div className="flex items-center gap-2 mb-4">
            Filter by package{" "}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    target="_blank"
                    href="https://www.flyde.dev/docs/packages"
                    rel="noreferrer"
                    className="cursor-pointer"
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  Click to learn more about how packages work in Flyde
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="tree-container">
            <Tree<AddNodeMenuFilter>
              contents={renderTreeNodes(filterStructure, filter, openNodes)}
              onNodeCollapse={onNodeCollapse}
              onNodeExpand={onNodeExpand}
              onNodeClick={onNodeClick}
              className="border-none"
            />
          </div>
        </aside>
        <main className="flex-1 p-4">{renderItems()}</main>
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Node Menu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search input"
              className="pl-8"
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
              value={query}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          {!stdLibInstalled && (
            <Alert>
              <AlertDescription>
                Using built-in @flyde/stdlib. It's recommended to explicitly
                install it instead.{" "}
                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={onInstallRuntime}
                >
                  Click here to install it using npm/yarn
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {renderContent()}
          {importablesErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center gap-2">
                Found{" "}
                {simplePluralize(importablesErrors.length, "corrupt flow")}
                <InfoTooltip
                  content={importablesErrors
                    .map(({ path, message }) => `${path}: ${message}`)
                    .join(", ")}
                />
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function renderTreeNodes(
  structure: AddNodeMenuFilterStructure,
  filter: AddNodeMenuFilter | null,
  expandedNodes: Set<TreeNodeInfo["id"]>
): TreeNodeInfo<AddNodeMenuFilter>[] {
  const externals = structure.external.map((external) => {
    return {
      id: external.module,
      label: external.module,
      hasCaret: true,
      nodeData: { type: "external" as const, module: external.module },
      isSelected:
        filter?.type === "external" && filter.module === external.module,
      isExpanded: expandedNodes.has(external.module),
      childNodes: external.namespaces.map((namespace) => {
        return {
          id: `${external.module}/${namespace}`,
          label: namespace,
          hasCaret: false,
          isSelected:
            filter?.type === "external" &&
            filter.module === external.module &&
            filter.namespace === namespace,
          isExpanded: expandedNodes.has(`${external.module}/${namespace}`),
          nodeData: {
            type: "external" as const,
            module: external.module,
            namespace,
          },
        };
      }),
    };
  });

  const internals = {
    id: "internal",
    label: "Current Project",
    nodeData: { type: "internal" as const },
    isExpanded: expandedNodes.has("internal"),
    hasCaret: true,
    isSelected: filter.type === "internal",
    childNodes: structure.internal.files.map((file) => {
      return {
        id: file,
        label: file,
        isSelected: filter.type === "internal" && filter.file === file,
        hasCaret: false,
        isExpanded: expandedNodes.has(file),
        nodeData: { type: "internal" as const, file },
      };
    }),
  };

  return [...externals, internals];
}

function isInternal(importable: ImportableSource) {
  return /\.flyde(\.[jt]s)?$/.test(importable.module);
}
