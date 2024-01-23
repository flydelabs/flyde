import * as React from "react";

import {
  ImportableSource,
  NodeDefinition,
  NodeInstance,
  PinType,
  values,
  Pos,
  ResolvedDependenciesDefinitions,
  VisualNode,
} from "@flyde/core";
// ;
import { MenuDivider, MenuItem } from "@blueprintjs/core";
import { Select, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import { highlightText } from "../../lib/highlight-text";
import { useDependenciesContext } from "../../flow-editor/DependenciesContext";

export type QuickMenuNodeMatch = {
  node: NodeDefinition;
  type: "node";
};

export type QuickMenuValueMatch = {
  type: "value";
};

export type QuickMenuImportMatch = {
  type: "import";
  importableNode: ImportableSource;
};

export type QuickMenuMatch =
  | QuickMenuNodeMatch
  | QuickMenuValueMatch
  | QuickMenuImportMatch;

export type QuickAddMenuData = {
  pos: Pos;
  ins?: NodeInstance;
  targetNode: NodeDefinition;
  pinId: string;
  pinType: PinType;
};

export type QuickMenuProps = QuickAddMenuData & {
  onAdd: (match: QuickMenuMatch) => void;
  onClose: () => void;
  node: VisualNode;
  resolvedDependencies: ResolvedDependenciesDefinitions;
};

// Select<T> is a generic component to work with your data types.
// In TypeScript, you must first obtain a non-generic reference:
const NodeSelect = Select.ofType<QuickMenuMatch>();

const matchTitle = (match: QuickMenuMatch) => {
  switch (match.type) {
    case "node": {
      return `${match.node.id}`;
    }
    case "value": {
      return "Add inline value or function";
    }
    case "import": {
      return `Import ${match.importableNode.node.id} from ${match.importableNode.module}`;
    }
  }
};

const renderNode: ItemRenderer<QuickMenuMatch> = (
  match,
  { handleClick, modifiers, query, index }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  const text = matchTitle(match);

  if (match.type === "value") {
    return (
      <React.Fragment key={index}>
        <MenuDivider />
        <MenuItem
          active={modifiers.active}
          disabled={modifiers.disabled}
          key={matchTitle(match)}
          onClick={handleClick}
          text={highlightText(text, query)}
        />
      </React.Fragment>
    );
  }

  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={matchTitle(match)}
      onClick={handleClick}
      text={highlightText(text, query)}
    />
  );
};

const nodePredicate: ItemPredicate<QuickMenuMatch> = (
  query,
  match,
  _index,
  exactMatch
) => {
  const normalizedTitle = matchTitle(match).toLocaleLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return normalizedTitle.includes(normalizedQuery);
  }
};

export const QuickAddMenu: React.FC<QuickMenuProps> = (props) => {
  const { resolvedDependencies, targetNode: node } = props;
  const style = {
    left: props.pos.x,
    top: props.pos.y,
  };

  const { onRequestImportables: onQueryImportables } = useDependenciesContext();

  const [importables, setImportables] = React.useState<ImportableSource[]>();

  React.useEffect(() => {
    onQueryImportables().then((data) => setImportables(data.importables));
  }, [onQueryImportables]);

  const availableNodes = values({
    ...resolvedDependencies,
    [node.id]: node,
  });

  const existingNodeMatches = availableNodes.map<QuickMenuMatch>((curr) => {
    return {
      type: "node",
      node: curr as NodeDefinition,
    };
  });

  const existingIds = new Set(availableNodes.map((p) => p.id));

  const importableNodes = importables
    ? importables
        .filter((imp) => !existingIds.has(imp.node.id))
        .map<QuickMenuMatch>((curr) => {
          return {
            type: "import",
            importableNode: curr,
          };
        })
    : [];

  const matches: QuickMenuMatch[] = existingNodeMatches
    .concat(importableNodes)
    .concat({ type: "value" });

  return (
    <div className="quick-add-menu" style={style}>
      <NodeSelect
        className="quick-add-nodes-select"
        items={matches}
        itemPredicate={nodePredicate}
        itemRenderer={renderNode}
        inputProps={{ className: "quick-add-input" }}
        noResults={<MenuItem disabled={true} text="No results." />}
        onItemSelect={(match) => props.onAdd(match)}
        popoverProps={{
          isOpen: true,
          onClose: () => props.onClose(),
        }}
      />

      {/* </Card> */}
    </div>
  );
};
