import {
  CustomPart,
  CustomPartRepo,
  FlydeFlow,
  isGroupedPart,
  PartDefinition,
  PartDefRepo,
} from "@flyde/core";
import classNames from "classnames";
import React, { useCallback, useEffect, useState } from "react";
import { Resizable, ResizeCallbackData } from "react-resizable";

import "react-resizable/css/styles.css";
import { useResizePref } from "@flyde/flow-editor";
import { MenuAddSection } from "./add-section";
import { folderIcon, menuAddIcon } from "./icons";

import "./style.scss";
import { values } from "@flyde/flow-editor";
// import { TriggersSection } from "./triggers-section";
// import { DeploymentsSection } from "./deployments-section";
import { EditorDebuggerClient } from "@flyde/remote-debugger";
import { Loader } from "@flyde/flow-editor";
import { buildNavigatorData } from "./build-navigator-data";
import { toastMsg } from "@flyde/flow-editor";
import { PartsRelationshipData } from "@flyde/flow-editor"; // ../../../common/lib/part-relationship-data
import { FoldersSection } from "./FoldersSection";
import { FlydeFlowChangeType, functionalChange } from "@flyde/flow-editor"; // ../../../common/flow-editor/flyde-flow-change-type
import produce from "immer";
import { NavigatorData } from "./FoldersSection/FlowPartsSection";

export interface IntegratedFlowSideMenuProps {
  repo: PartDefRepo;

  flow: FlydeFlow;
  flowPath: string;
  partsRelationshipData: PartsRelationshipData;

  editedPart: CustomPart;

  onAdd: (part: PartDefinition) => void;
  onEditPart: (part: CustomPart) => void;
  onAddPart: (part: CustomPart) => void;
  onDeletePart: (part: CustomPart) => void;
  onRenamePart: (part: CustomPart) => void;

  onChangeFlow: (flow: FlydeFlow, type: FlydeFlowChangeType) => void;

  inspectedPin?: any;

  selectedMenuItem?: string;
  setSelectedMenuItem: (item?: string) => void;

  onFocusInstance: (insId: string) => void;

  // onChangeDeployments: (data: RunningDeploymentData[]) => void;
  editorDebugger?: EditorDebuggerClient;
  resolvedParts: CustomPartRepo;
}

interface SideMenuBtnProps {
  icon: string;
  selected: boolean;
  type: string;
  onClick: (type: string) => void;
  badge?: JSX.Element;
}

const SideMenuBtn: React.FC<SideMenuBtnProps> = (props) => {
  const { icon, selected, type, onClick, badge } = props;
  const _onClick = useCallback(() => onClick(type), [type, onClick]);

  const innerIcon = <div className="inner" dangerouslySetInnerHTML={{ __html: icon }} />;

  return (
    <div className={`menu-btn ${type} ${selected ? "selected" : ""}`} onClick={_onClick}>
      {innerIcon}
      {badge}
    </div>
  );
};

export const IntegratedFlowSideMenu: React.FC<IntegratedFlowSideMenuProps> = (props) => {
  const {
    selectedMenuItem: selectedItem,
    setSelectedMenuItem: setSelectedItem,
    flow,
    onEditPart: onEdit,
    onRenamePart,
    onDeletePart,
    onAddPart,
    onFocusInstance,
    onChangeFlow,
  } = props;

  const onSelect = (item: string) => {
    if (selectedItem === item) {
      setSelectedItem(undefined);
    } else {
      setSelectedItem(item);
    }
  };

  const [width, setWidth] = useResizePref(`side-bar.${selectedItem || "none"}`, 255);
  const onResize = (_: any, data: ResizeCallbackData) => {
    setWidth(data.size.width);
  };

  const [navigatorData, setNavigatorData] = useState<NavigatorData>();

  useEffect(() => {
    const usage = values(flow.parts).reduce<Map<string, string[]>>((acc, currPart) => {
      if (isGroupedPart(currPart)) {
        currPart.instances.forEach((ins) => {
          if (flow.parts[ins.partId]) {
            const curr = acc.get(ins.partId) || [];
            if (!curr.includes(currPart.id) && currPart.id !== ins.partId) {
              acc.set(ins.partId, [...curr, currPart.id]);
            }
          }
        });
      }
      return acc;
    }, new Map());

    const navData = buildNavigatorData(flow, usage, props.resolvedParts);
    setNavigatorData(navData);
  }, [flow, props.resolvedParts]);

  const onNavigatorEditPart = React.useCallback(
    (partId) => {
      const part = flow.parts[partId];
      if (!part) {
        throw new Error(`editing inexisting part ${partId}`);
      }
      onEdit(part);
    },
    [onEdit, flow]
  );

  const onNavigatorRenamePart = React.useCallback(
    (partId) => {
      const part = flow.parts[partId];
      if (!part) {
        throw new Error(`editing inexisting part ${partId}`);
      }
      onRenamePart(part);
    },
    [onRenamePart, flow]
  );

  const onNavigatorDeletePart = React.useCallback(
    (partId) => {
      const part = flow.parts[partId];
      if (!part) {
        throw new Error(`deleting inexisting part ${partId}`);
      }
      onDeletePart(part);
    },
    [onDeletePart, flow]
  );

  const onClonePart = React.useCallback(
    (partId: string) => {
      const part = flow.parts[partId];
      if (!part) {
        throw new Error(`cloning inexisting part ${partId}`);
      }
      const newName = prompt("Id?", part.id) || "";

      if (!newName) {
        return;
      }

      if (flow.parts[newName]) {
        toastMsg("Name exists");
        return;
      }
      return onAddPart({
        ...part,
        id: newName,
      });
    },
    [onAddPart, flow]
  );

  const onChangeMainPartId = useCallback(
    (partId) => {
      onChangeFlow(
        produce(flow, (draft) => {
          draft.mainId = partId;
        }),
        functionalChange("change main id")
      );
    },
    [flow, onChangeFlow]
  );

  const onChangeExported = useCallback(
    (exported: string[]) => {
      onChangeFlow(
        produce(flow, (draft) => {
          draft.exports = exported;
        }),
        functionalChange("change main id")
      );
    },
    [flow, onChangeFlow]
  );

  const renderSection = () => {
    switch (selectedItem) {
      case undefined:
        return "";
      case "add": {
        return (
          <div className="menu-section add" style={{ width: `${width}px` }}>
            <div className="title">Add part</div>
            <MenuAddSection onAdd={props.onAdd} repo={props.repo} />
          </div>
        );
      }
      case "folder": {
        if (!navigatorData) {
          return <Loader />;
        }
        return (
          <div className="menu-section folder" style={{ width: `${width}px` }}>
            <div className="title">Files & Flows</div>
            <FoldersSection
              currentFile={props.flowPath}
              relationshipData={props.partsRelationshipData}
              editedPart={props.editedPart}
              data={navigatorData}
              onEditPart={onNavigatorEditPart}
              onFocusInstance={onFocusInstance}
              onRenamePart={onNavigatorRenamePart}
              onDeletePart={onNavigatorDeletePart}
              onClonePart={onClonePart}
              flow={props.flow}
              onChangeMainPartId={onChangeMainPartId}
              onChangeExported={onChangeExported}
            />
          </div>
        );
      }

      default: {
        return (
          <div className="menu-section" style={{ width: `${width}px` }}>
            <div className="title">Coming soon!</div>
          </div>
        );
      }
    }
  };

  const handle = <div className="resizer" />;

  return (
    <div className={classNames("side-menu", {})}>
      <div className="menu-strip">
        <SideMenuBtn
          icon={folderIcon}
          type="folder"
          selected={selectedItem === "folder"}
          onClick={onSelect}
        />
        <SideMenuBtn
          icon={menuAddIcon}
          type="add"
          selected={selectedItem === "add"}
          onClick={onSelect}
        />
      </div>
      {selectedItem ? (
        <Resizable
          width={width}
          height={0}
          resizeHandles={["e"]}
          handle={handle}
          onResize={onResize}
          axis="x"
          minConstraints={[100, 0]}
          maxConstraints={[1000, 0]}
        >
          {renderSection()}
        </Resizable>
      ) : null}
    </div>
  );
};
