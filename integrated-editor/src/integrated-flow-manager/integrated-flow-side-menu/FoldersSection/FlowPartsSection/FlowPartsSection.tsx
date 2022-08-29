import { CustomPart, FlydeFlow } from "@flyde/core";
import {
  Tree,
  Classes,
  TreeEventHandler,
  Menu,
  MenuItem,
  ContextMenu,
} from "@blueprintjs/core";
import React, { useEffect } from "react";
import { navigatorItemtoBpNode } from "./navigator-item-to-bp-node";

import "./FlowPartsSection.scss";
import { PartsRelationshipData } from "@flyde/flow-editor"; // ../../../../../common/lib/part-relationship-data
import { navigatorItemSort } from "../../build-navigator-data";
import { preventDefaultAnd } from "@flyde/flow-editor"; // ../../../../../common/utils
export interface BaseNavigatorItem {
  id: string;
  label: string;
}
export interface NavigatorInternalInstanceItem extends BaseNavigatorItem {
  type: "internal-instance";
}

export interface NavigatorExternalInstanceItem extends BaseNavigatorItem {
  type: "external-instance";
}

export interface NavigatorInstanceGroup extends BaseNavigatorItem {
  type: "instance-group";
  count: number;
  children: Array<NavigatorItem>;
}

export interface NavigatorVisualPartItem extends BaseNavigatorItem {
  type: "visual-part";
  usages: string[];
  children: NavigatorItem[];
  exported: boolean;
  isMain: boolean;
}

export interface NavigatorCodePartItem extends BaseNavigatorItem {
  type: "code-part";
  usages: string[];
  exported: boolean;
  isMain: boolean;
}

export type NavigatorPartItem = NavigatorVisualPartItem | NavigatorCodePartItem;
export type NavigatorItem =
  | NavigatorInternalInstanceItem
  | NavigatorExternalInstanceItem
  | NavigatorPartItem
  | NavigatorInstanceGroup

export type NavigatorData = {
  triggers: NavigatorItem[];
  shared: NavigatorItem[];
  orphan: NavigatorItem[];
};

export interface FlowPartsSectionProps {
  flow: FlydeFlow;
  data: NavigatorData;
  relationshipData: PartsRelationshipData;
  editedPart: CustomPart;
  
  onEditPart: (partId: string) => void;
  onRenamePart: (partId: string) => void;
  onDeletePart: (partId: string) => void;
  onClonePart: (partId: string) => void;
  onFocusInstance: (partId: string) => void;

  onChangeExported: (exportedParts: string[]) => void;
  onChangeMainPartId: (partId: string) => void;
}

export const FlowPartsSection: React.FC<FlowPartsSectionProps> = (props) => {
  const {
    data,
    onEditPart,
    onRenamePart,
    onDeletePart,
    onClonePart,
    editedPart,
    relationshipData,
    onFocusInstance,
    onChangeMainPartId,
    onChangeExported,
    flow
  } = props;

  const [expanded, setExpanded] = React.useState(new Set<any>());

  const [selected, setSelected] = React.useState(new Set<string>([editedPart.id]));

  useEffect(() => {
    let node: any = relationshipData.nodeMap[editedPart.id];
    const s = new Set<any>([editedPart.id]);
    const ex = new Set<any>();
    while (node) {
      ex.add(node.part.id);
      node = node.parent;
    }
    setSelected(s);
    setExpanded((e) => {
      return new Set([...Array.from(e), ...Array.from(ex)]);
    });
  }, [editedPart.id, relationshipData]);
  
  const triggers = data.triggers.map((i) => navigatorItemtoBpNode(i, expanded, selected));

  const sharedAndOrphanItems = data.shared.concat(data.orphan).sort(navigatorItemSort);

  const sharedAndOrphans = sharedAndOrphanItems.map((i) =>
    navigatorItemtoBpNode(i, expanded, selected)
  );

  const onExpand: TreeEventHandler<NavigatorItem> = React.useCallback((node) => {
    setExpanded((e) => {
      return new Set(e.add(node.id));
    });
  }, []);

  const onCollapse: TreeEventHandler<NavigatorItem> = React.useCallback((node) => {
    setExpanded((e) => {
      e.delete(node.id);
      return new Set(e);
    });
  }, []);

  const onClickNode: TreeEventHandler<NavigatorItem> = React.useCallback(
    (node) => {
      const data = node.nodeData;
      
      if (data) {
        const isPart = (
          data.type === "code-part" ||
          data.type === "visual-part"
        )

        if (isPart) {
            onEditPart(data.id);
          } else if (data.type.includes('instance')) {
            onFocusInstance(data.id);
          }
      }
    },
    [onEditPart, onFocusInstance]
  );

  const onDblClickNode: TreeEventHandler<NavigatorItem> = React.useCallback(
    (node) => {
      const data = node.nodeData;
      if (data) {
        if (
          data.type === "code-part" ||
          data.type === "visual-part"
        ) {
          onEditPart(data.id);
        }
      }
    },
    [onEditPart]
  );

  const onSetAsMainPart = React.useCallback(
    (partId: string) => {
      onChangeMainPartId(partId);
    }, [onChangeMainPartId]);

  const onToggleExportedPart = React.useCallback(
    (partId: string) => {
      const exportedParts = new Set(flow.exports);
      if (exportedParts.has(partId)) {
        exportedParts.delete(partId);
      } else {
        exportedParts.add(partId);
      }
      onChangeExported(Array.from(exportedParts));
    }, [onChangeExported, flow]);

  const onNodeContextMenu: TreeEventHandler<NavigatorItem> = React.useCallback(
    (node, _, e) => {
      const data = node.nodeData;

      if (data?.type === "visual-part" || data?.type === "code-part") {
        e.preventDefault();

        const menu = (
          <Menu>
            <MenuItem
              label={`Set as main part`}
              onClick={preventDefaultAnd(() => onSetAsMainPart(data.id))}
              // onClick={preventDefaultAnd(() => onAddIoPin("input"))}
              // disabled={!partIoEditable}
            />
            <MenuItem
              label={props.flow.exports.includes(data.id) ? "Remove from exports" : "Add to exports"}
              onClick={preventDefaultAnd(() => onToggleExportedPart(data.id))}
              // onClick={preventDefaultAnd(() => onAddIoPin("input"))}
              // disabled={!partIoEditable}
            />
            <MenuItem
              label={`Rename part`}
              onClick={preventDefaultAnd(() => onRenamePart(data.id))}
              // onClick={preventDefaultAnd(() => onAddIoPin("input"))}
              // disabled={!partIoEditable}
            />
            <MenuItem
              label={`Duplicate Part`}
              onClick={preventDefaultAnd(() => onClonePart(data.id))}
              // onClick={preventDefaultAnd(() => onAddIoPin("input"))}
              // disabled={!partIoEditable}
            />
            <MenuItem
              label={`Delete part`}
              intent="danger"
              onClick={preventDefaultAnd(() => onDeletePart(data.id))}
              // onClick={preventDefaultAnd(() => onAddIoPin("input"))}
              // disabled={!partIoEditable}
            />
          </Menu>
        );

        ContextMenu.show(menu, { left: e.pageX, top: e.pageY });
      }
    },
    [props.flow.exports, onSetAsMainPart, onToggleExportedPart, onRenamePart, onClonePart, onDeletePart]
  );


  return (
    <div className="flow-parts-section">
      <h5>Parts</h5>
      <Tree
        contents={triggers}
        onNodeExpand={onExpand}
        onNodeCollapse={onCollapse}
        onNodeClick={onClickNode}
        onNodeDoubleClick={onDblClickNode}
        onNodeContextMenu={onNodeContextMenu}
        // onNodeClick={handleNodeClick}
        // onNodeCollapse={handleNodeCollapse}
        // onNodeExpand={handleNodeExpand}
        className={Classes.ELEVATION_0}
      />
      <h5>Exported Parts</h5>
      <Tree
        contents={sharedAndOrphans}
        onNodeExpand={onExpand}
        onNodeCollapse={onCollapse}
        onNodeClick={onClickNode}
        onNodeDoubleClick={onDblClickNode}
        onNodeContextMenu={onNodeContextMenu}
        // onNodeClick={handleNodeClick}
        // onNodeCollapse={handleNodeCollapse}
        // onNodeExpand={handleNodeExpand}
        className={Classes.ELEVATION_0}
      />
    </div>
  );
};
