import * as React from "react";

import {
  ImportableSource,
  PartDefinition,
  PartInstance,
  PinType,
  values,
  Pos,
  ResolvedDependenciesDefinitions,
  VisualPart,
} from "@flyde/core";
// ;
import { MenuDivider, MenuItem } from "@blueprintjs/core";
import { Select, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import { highlightText } from "../../lib/highlight-text";
import { useDependenciesContext } from "../../flow-editor/DependenciesContext";

export type QuickMenuPartMatch = {
  part: PartDefinition;
  type: "part";
};

export type QuickMenuValueMatch = {
  type: "value";
};

export type QuickMenuImportMatch = {
  type: "import";
  importablePart: ImportableSource;
};

export type QuickMenuMatch =
  | QuickMenuPartMatch
  | QuickMenuValueMatch
  | QuickMenuImportMatch;

export type QuickAddMenuData = {
  pos: Pos;
  ins?: PartInstance;
  targetPart: PartDefinition;
  pinId: string;
  pinType: PinType;
};

export type QuickMenuProps = QuickAddMenuData & {
  onAdd: (match: QuickMenuMatch) => void;
  onClose: () => void;
  part: VisualPart;
  resolvedDependencies: ResolvedDependenciesDefinitions;
};

// Select<T> is a generic component to work with your data types.
// In TypeScript, you must first obtain a non-generic reference:
const PartSelect = Select.ofType<QuickMenuMatch>();

const matchTitle = (match: QuickMenuMatch) => {
  switch (match.type) {
    case "part": {
      return `${match.part.id}`;
    }
    case "value": {
      return "Add inline value or function";
    }
    case "import": {
      return `Import ${match.importablePart.part.id} from ${match.importablePart.module}`;
    }
  }
};

const renderPart: ItemRenderer<QuickMenuMatch> = (
  match,
  { handleClick, modifiers, query }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  const text = matchTitle(match);

  if (match.type === "value") {
    return (
      <React.Fragment>
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

const partPredicate: ItemPredicate<QuickMenuMatch> = (
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
  const { resolvedDependencies, targetPart: part } = props;
  const style = {
    left: props.pos.x,
    top: props.pos.y,
  };

  const { onRequestImportables: onQueryImportables } = useDependenciesContext();

  const [importables, setImportables] = React.useState<ImportableSource[]>();

  React.useEffect(() => {
    onQueryImportables().then(setImportables);
  }, [onQueryImportables]);

  const availableParts = values({
    ...resolvedDependencies,
    [part.id]: part,
  });

  const existingPartMatches = availableParts.map<QuickMenuMatch>((curr) => {
    return {
      type: "part",
      part: curr as PartDefinition,
    };
  });

  const existingIds = new Set(availableParts.map((p) => p.id));

  const importableParts = importables
    ? importables
        .filter((imp) => !existingIds.has(imp.part.id))
        .map<QuickMenuMatch>((curr) => {
          return {
            type: "import",
            importablePart: curr,
          };
        })
    : [];

  const matches: QuickMenuMatch[] = existingPartMatches
    .concat(importableParts)
    .concat({ type: "value" });

  return (
    <div className="quick-add-menu" style={style}>
      <PartSelect
        className="quick-add-parts-select"
        items={matches}
        itemPredicate={partPredicate}
        itemRenderer={renderPart}
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
