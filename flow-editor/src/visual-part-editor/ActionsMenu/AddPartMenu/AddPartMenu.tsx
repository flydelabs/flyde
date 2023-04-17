import {
  Button,
  Callout,
  Classes,
  Dialog,
  Icon,
  Intent,
  ITreeNode,
  Tree,
} from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import { ImportableSource } from "@flyde/core";
import classNames from "classnames";
import React, { useCallback, useEffect } from "react";
import { LocalImportableResult } from "../../../flow-editor/DependenciesContext";
import { usePorts } from "../../../flow-editor/ports";
import { InfoTooltip } from "../../../lib/InfoTooltip";
import { Loader } from "../../../lib/loader";
import { AddPartMenuListItem } from "./AddPartMenuListItem";
import { AddPartMenuResultsSummary } from "./AddPartMenuResultsSummary";

export interface AddPartMenuProps {
  onRequestImportables: () => Promise<LocalImportableResult>;
  onAddPart: (part: ImportableSource) => void;
  onClose: () => void;
}

export const AddPartMenuFilterTree = Tree.ofType<AddPartMenuFilter>();

export type AddPartMenuFilter =
  | { type: "external"; module: string; namespace?: string }
  | { type: "internal"; file?: string }
  | { type: "all" };
export type AddPartMenuFilterStructure = {
  external: { module: string; namespaces: string[] }[];
  internal: { files: string[] };
};

export const AddPartMenu: React.FC<AddPartMenuProps> = (props) => {
  const { onRequestImportables, onAddPart, onClose } = props;

  const [importables, setImportables] = React.useState<ImportableSource[]>();
  const [importablesErrors, setImportablesErrors] = React.useState<
    LocalImportableResult["errors"]
  >([]);
  const [openNodes, setOpenNodes] = React.useState<Set<ITreeNode["id"]>>(
    new Set()
  );

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<AddPartMenuFilter>({
    type: "all",
  });
  const [filterStructure, setFilterStructure] =
    React.useState<AddPartMenuFilterStructure>(null);

  const [visibleImportables, setVisibleImportables] = React.useState<
    ImportableSource[] | null
  >(null);

  const [selectedPart, setSelectedPart] =
    React.useState<ImportableSource>(null);

  const onNodeExpand = useCallback(
    (node: ITreeNode) => {
      openNodes.add(node.id);
      setOpenNodes(new Set(openNodes));
    },
    [openNodes]
  );

  const onNodeCollapse = useCallback(
    (node: ITreeNode) => {
      openNodes.delete(node.id);
      setOpenNodes(new Set(openNodes));
    },
    [openNodes]
  );

  const _onAddPart = useCallback(
    (part: ImportableSource) => {
      onAddPart(part);
      onClose();
    },
    [onAddPart, onClose]
  );

  const { onInstallRuntimeRequest, reportEvent } = usePorts();

  useEffect(() => {
    reportEvent("addPartMenuOpen", {});
  }, [reportEvent]);

  useEffect(() => {
    setVisibleImportables(
      importables
        ?.flatMap((importable) => {
          if (filter) {
            if (filter.type === "external") {
              if (
                importable.module !== filter.module || filter.namespace
                  ? importable.part.namespace !== filter.namespace
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
              importable.part.searchKeywords?.join(" ") ?? []
            } ${importable.part.id} ${importable.part.namespace ?? ""} ${
              importable.part.description
            }`;
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
          const namespace = importable.part.namespace ?? "";

          if (!acc[importable.module].includes(namespace)) {
            acc[importable.module].push(namespace);
          }
          return acc;
        }, {});

      const internalFiles = importables
        .filter(isInternal)
        .map((importable) => importable.module);

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

          if (visibleImportables && !selectedPart) {
            setSelectedPart(
              visibleImportables[
                e.key === "ArrowDown" ? 0 : visibleImportables.length - 1
              ]
            );
            return;
          }

          if (visibleImportables && selectedPart) {
            const index = visibleImportables.findIndex(
              (p) => p === selectedPart
            );
            let nextIndex = e.key === "ArrowDown" ? index + 1 : index - 1;
            nextIndex =
              nextIndex < 0 ? visibleImportables.length - 1 : nextIndex;
            nextIndex = nextIndex >= visibleImportables.length ? 0 : nextIndex;
            setSelectedPart(visibleImportables[nextIndex]);
          }
          break;
        }
        case "Enter": {
          if (selectedPart) {
            _onAddPart(selectedPart);
          }
          break;
        }
      }
    },
    [visibleImportables, selectedPart, _onAddPart]
  );

  const onNodeClick = useCallback(
    ({ nodeData }: ITreeNode<AddPartMenuFilter>) => {
      if (JSON.stringify(nodeData) === JSON.stringify(filter)) {
        if (nodeData.type === "external") {
          if (nodeData.namespace) {
            setFilter({ type: "external", module: nodeData.module });
          } else {
            setFilter({ type: "all" });
          }
        } else if (nodeData.type === "internal") {
          if (nodeData.file) {
            setFilter({ type: "internal" });
          } else {
            setFilter({ type: "all" });
          }
        }
      } else {
        setFilter(nodeData);
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
        <div className="no-results">
          <AddPartMenuResultsSummary
            filter={filter}
            onChangeFilter={setFilter}
            query={query}
            onChangeQuery={setQuery}
            resultsCount={visibleImportables.length}
          />
          <Callout className="callout" intent="primary">
            Can't find a suitable part? Create one yourself!{" "}
            <a
              href="https://www.flyde.dev/docs/code-parts"
              target="_blank"
              rel="noreferrer"
            >
              Learn more
            </a>
          </Callout>
        </div>
      );
    }

    return (
      <React.Fragment>
        <AddPartMenuResultsSummary
          filter={filter}
          onChangeFilter={setFilter}
          query={query}
          onChangeQuery={setQuery}
          resultsCount={visibleImportables.length}
        />
        <div className="results">
          {visibleImportables.map((importablePart) => (
            <AddPartMenuListItem
              importablePart={importablePart}
              key={
                importablePart.part.id +
                importablePart.part.namespace +
                importablePart.module
              }
              onAdd={_onAddPart}
              selected={selectedPart?.part === importablePart.part}
              onSelect={setSelectedPart}
              onSetFilter={setFilter}
            />
          ))}
        </div>
      </React.Fragment>
    );
  }

  function renderContent() {
    if (!importables) {
      return <Loader />;
    }

    return (
      <React.Fragment>
        <aside>
          <div className="filter-header">
            Filter by package{" "}
            <Tooltip2
              content={
                <span>
                  Click to learn more about how packages work in Flyde{" "}
                </span>
              }
              hoverCloseDelay={1500}
            >
              <a
                target="_blank"
                href="https://www.flyde.dev/docs/packages"
                rel="noreferrer"
              >
                <Icon icon="help" intent="primary" iconSize={12} />
              </a>
            </Tooltip2>
          </div>
          <div className="tree-container">
            <AddPartMenuFilterTree
              contents={renderTreeNodes(filterStructure, filter, openNodes)}
              onNodeCollapse={onNodeCollapse}
              onNodeExpand={onNodeExpand}
              onNodeClick={onNodeClick}
              className={Classes.ELEVATION_0}
            />
          </div>
        </aside>
        <main>{renderItems()}</main>
      </React.Fragment>
    );
  }

  return (
    <Dialog
      isOpen={true}
      title="Add Part Menu"
      onClose={props.onClose}
      className="add-part-menu"
      isCloseButtonShown={true}
    >
      <main className={classNames(Classes.DIALOG_BODY)}>
        <header>
          <div className="bp3-input-group">
            <Icon icon="search" />
            <input
              className="bp3-input"
              type="search"
              placeholder="Search input"
              dir="auto"
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
              value={query}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          {stdLibInstalled ? null : (
            <Callout intent={Intent.NONE} style={{ marginTop: 10 }}>
              Using built-in @flyde/stdlib. It's recommended to explicitly
              install it instead.{" "}
              <Button
                minimal
                small
                intent={Intent.PRIMARY}
                onClick={onInstallRuntime}
              >
                Click here to install it using npm/yarn
              </Button>
            </Callout>
          )}
        </header>
        <div className="content-wrapper">{renderContent()}</div>
        {importablesErrors.length > 0 ? (
          <Callout intent="warning" style={{ marginTop: "10px" }}>
            Found {importablesErrors.length} corrupt flow(s).{" "}
            <InfoTooltip
              content={importablesErrors.map((err) => err.path).join(", ")}
            />{" "}
          </Callout>
        ) : null}
      </main>
    </Dialog>
  );
};

function renderTreeNodes(
  structure: AddPartMenuFilterStructure,
  filter: AddPartMenuFilter | null,
  expandedNodes: Set<ITreeNode["id"]>
): ITreeNode<AddPartMenuFilter>[] {
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
    // hasCaret: true,
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
