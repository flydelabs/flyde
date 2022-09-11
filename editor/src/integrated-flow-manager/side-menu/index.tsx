import {
  CustomPart,
  CustomPartRepo,
  FlydeFlow,
  PartDefinition,
  PartDefRepo,
} from "@flyde/core";
import classNames from "classnames";
import React, { useCallback } from "react";
import { Resizable, ResizeCallbackData } from "react-resizable";

import "react-resizable/css/styles.css";
import { useResizePref } from "@flyde/flow-editor";
import { MenuAddSection } from "./add-section";
import { folderIcon, menuAddIcon } from "./icons";

import "./style.scss";
// import { TriggersSection } from "./triggers-section";
// import { DeploymentsSection } from "./deployments-section";
import { EditorDebuggerClient } from "@flyde/remote-debugger";
// import { buildNavigatorData } from "./build-navigator-data";
import { FoldersSection } from "./FoldersSection";
import { FlydeFlowChangeType } from "@flyde/flow-editor"; // ../../../common/flow-editor/flyde-flow-change-type

export interface IntegratedFlowSideMenuProps {
  repo: PartDefRepo;

  flow: FlydeFlow;
  flowPath: string;

  onAdd: (part: PartDefinition) => void;
  // onEditPart: (part: CustomPart) => void;
  // onAddPart: (part: CustomPart) => void;
  // onDeletePart: (part: CustomPart) => void;
  // onRenamePart: (part: CustomPart) => void;

  onChangeFlow: (flow: FlydeFlow, type: FlydeFlowChangeType) => void;

  inspectedPin?: any;

  selectedMenuItem?: string;
  setSelectedMenuItem: (item?: string) => void;

  onFocusInstance: (insId: string) => void;

  // onChangeDeployments: (data: RunningDeploymentData[]) => void;
  editorDebugger?: EditorDebuggerClient;
  resolvedParts: PartDefRepo;
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
    onFocusInstance,
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
        return (
          <div className="menu-section folder" style={{ width: `${width}px` }}>
            <div className="title">Files & Flows</div>
            <FoldersSection
              currentFile={props.flowPath}
              editedPart={props.flow.part}
              onFocusInstance={onFocusInstance}
              flow={props.flow}
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
