import { Button, Tooltip } from "@blueprintjs/core";
import { ImportableSource, ImportedNode, NodeLibraryData } from "@flyde/core";
import classNames from "classnames";
import React, { memo, useEffect, useState } from "react";
import { useDependenciesContext } from "../../flow-editor/DependenciesContext";
import { AddNodeMenu } from "./AddNodeMenu";
import { useDarkMode } from "../../flow-editor/DarkModeContext";
import { useIsFirstRender } from "usehooks-ts";
import p from "@blueprintjs/icons/lib/esm/generated/16px/paths/blank";

export interface NodesLibraryProps extends NodeLibraryData {
  onAddNode: (node: ImportableSource) => void;
}

export const NodesLibrary: React.FC<NodesLibraryProps> = memo((props) => {
  const { groups } = props;
  const [isClosed, setIsClosed] = React.useState(false);

  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  const isFirstRender = useIsFirstRender();

  const [showAddNodeMenu, setShowAddNodeMenu] = React.useState(false);

  const { onRequestImportables } = useDependenciesContext();

  const darkMode = useDarkMode();

  const [openGroup, setOpenGroup] = useState(groups[0]?.title ?? "");

  useEffect(() => {
    if (!isFirstRender) {
      setShouldAnimate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosed]);

  useEffect(() => {
    if (groups.length) {
      setOpenGroup(groups[0].title);
    }
  }, [groups]);

  return (
    <div
      className={classNames("nodes-library", {
        closed: isClosed,
        open: !isClosed,
        animate: shouldAnimate,
        dark: darkMode,
      })}
    >
      <div className="header" onClick={() => setIsClosed(!isClosed)}>
        <strong>Nodes Library</strong>
      </div>
      <div className="list">
        {groups.map((group) => (
          <div>
            <div
              className={classNames("group-title", {
                open: openGroup === group.title,
                selected: openGroup === group.title,
              })}
              onClick={() => setOpenGroup(group.title)}
            >
              {group.title}
            </div>
            {/* {openGroup === group.title ? ( */}
            <div className="group-items">
              {group.nodes.map((node) => (
                <div
                  className="group-item"
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
                    {node.displayName ?? node.id}
                  </Tooltip>
                </div>
              ))}
            </div>
            {/* ) : null} */}
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
