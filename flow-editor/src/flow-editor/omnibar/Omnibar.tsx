import * as React from "react";

import { Omnibar as ExternalOmnibar, ItemRenderer } from "@blueprintjs/select";
import {
  Node,
  NodesDefCollection,
  keys,
  ImportableSource,
  FlydeFlow,
} from "@flyde/core";
import { okeys } from "@flyde/core";
import { MenuItem } from "@blueprintjs/core";
import classNames from "classnames";

export interface OmnibarProps {
  visible: boolean;
  onClose: () => void;
  onCommand: (cmd: OmniBarCmd) => void;
  onRequestImportables?: (query: string) => Promise<ImportableSource[]>;
  resolvedNodes: NodesDefCollection;
  flow: FlydeFlow;
}

export enum OmniBarCmdType {
  ADD = "add",
  ADD_VALUE = "add-value",
  IMPORT = "import",
}

export type OmniBarCmd = {
  type: OmniBarCmdType;
  data?: any;
};

export type OmniBarItem = {
  cmd: OmniBarCmd;
  title: string;
  description?: string;
  extra?: string;
  suggestOnEmpty?: boolean;
};

export type OmniBarState = {
  items: OmniBarItem[];
  value: string;
};

const SYSTEM_ITEMS: OmniBarItem[] = [
  // {
  //   cmd: {
  //     type: OmniBarCmdType.CREATE_GROUPED_node,
  //   },
  //   title: "Create new visual node",
  //   suggestOnEmpty: true,
  // },
  // {
  //   cmd: {
  //     type: OmniBarCmdType.CREATE_CODE_node,
  //   },
  //   title: "Create new code node",
  //   suggestOnEmpty: true,
  // },
];

const escapeQuery = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
export const Omnibar: React.FC<OmnibarProps> = (props) => {
  const { resolvedNodes } = props;

  const [searchValue, setSearchValue] = React.useState("");
  const [items, setItems] = React.useState<OmniBarItem[] | null>(null);

  const [importables, setImportables] = React.useState<ImportableSource[]>([]);

  React.useEffect(() => {
    const all = keys(resolvedNodes);
    const addItems = all
      // .filter((k) => k.includes(query))
      .map((k) => {
        const node: Node = resolvedNodes[k] as Node;
        return {
          title: `${node.id}`,
          cmd: {
            type: OmniBarCmdType.ADD,
            data: k,
          },
          extra: `current flow`,
        };
      });

    const importableItems = importables.map((i) => {
      return {
        title: `${i.node.id}`,
        description: i.node.description,
        cmd: {
          type: OmniBarCmdType.IMPORT,
          data: i,
        },
        extra: `${i.module}`,
      };
    });

    const addInlineValue: OmniBarItem = {
      title: "Add inline value or code",
      suggestOnEmpty: true,
      cmd: {
        type: OmniBarCmdType.ADD_VALUE,
      },
    };

    const items = [
      ...SYSTEM_ITEMS,
      ...importableItems,
      addInlineValue,
      ...addItems,
    ];

    setItems(items);
  }, [resolvedNodes, importables]);

  React.useEffect(() => {
    if (props.onRequestImportables) {
      props.onRequestImportables(searchValue).then((imps) => {
        setImportables(imps);
      });
    }
  }, [props, searchValue]);

  const renderItem: ItemRenderer<any> = React.useCallback(
    (item: OmniBarItem, { handleClick, modifiers, query, index }) => {
      if (!modifiers.matchesPredicate) {
        return null;
      }
      const text = `${item.title}`;
      return (
        <MenuItem
          key={index}
          active={modifiers.active}
          disabled={modifiers.disabled}
          // label={item.extra}
          // key={film.rank}
          onClick={handleClick}
          text={
            <div
              className={classNames("omnibar-item", {
                active: modifiers.active,
              })}
            >
              <div className="title">
                {text}{" "}
                {item.extra ? (
                  <span className="extra">{item.extra}</span>
                ) : null}
              </div>
              {item.description ? (
                <div className="description">{item.description}</div>
              ) : null}
            </div>
          }
        />
      );
    },
    []
  );

  const predicate = React.useCallback((query: string, item: OmniBarItem) => {
    // if (!query) {
    //   // return !!item.suggestOnEmpty;
    // }

    const regex = query
      .toLowerCase()
      .split("")
      .map((c) => `${escapeQuery(c)}.*`)
      .join("");
    const pattern = new RegExp(regex);
    return !!item.title.toLowerCase().match(pattern);
  }, []);

  const onSelect = React.useCallback(
    (item: OmniBarItem) => {
      props.onCommand(item.cmd);
      props.onClose();
    },
    [props]
  );

  return items ? (
    <ExternalOmnibar
      query={searchValue}
      onQueryChange={setSearchValue}
      onClose={props.onClose}
      noResults={<MenuItem disabled={true} text="No results." />}
      itemPredicate={predicate}
      isOpen={props.visible}
      items={items}
      initialContent={undefined}
      onItemSelect={onSelect as any}
      itemRenderer={renderItem}
      inputProps={{ placeholder: "Search for nodes or commands.." }}
    />
  ) : null;
};
