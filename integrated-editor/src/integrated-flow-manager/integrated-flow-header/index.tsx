import "./style.scss";

import * as React from "react";
import { Popover, Menu, Position, MenuItem } from "@blueprintjs/core";

import { CustomPart, isDefined, getPartWithDependencies, FlydeFlow } from "@flyde/core";

import { toastMsg } from "@flyde/flow-editor"; // ../../../common/toaster

import logo from "./Logo.png";
import produce from "immer";
import { PartsRelationshipData } from "@flyde/flow-editor"; // ../../../common/lib/part-relationship-data
import { Breadcrumbs } from "../breadcrumbs";

import { FlydeFlowChangeType, functionalChange } from "@flyde/flow-editor"; // ../../../common/flow-editor/flyde-flow-change-type

const FileSaver = require("file-saver");
const { useHistory } = require("react-router-dom");

export type IntegratedFlowHeaderProps = {
  flow: FlydeFlow;
  part: CustomPart;

  relationshipData: PartsRelationshipData;

  onChangeFlow: (flow: FlydeFlow, type: FlydeFlowChangeType) => void;

  onOverrideEditedPart: (newPart: CustomPart) => void;
  onChangeEditedPart: (partId: string) => void;

};

export const IntegratedFlowHeader: React.FC<IntegratedFlowHeaderProps> = React.memo((props) => {
  const { flow, onChangeFlow: onChangeProject, onOverrideEditedPart, onChangeEditedPart } = props;

  const download = () => {
    const str = JSON.stringify(flow, null, 4);
    const blob = new Blob([str], { type: "text/plain;charset=utf-8" });

    const fileName = `flow-${Date.now()}.flyde`;

    FileSaver.saveAs(blob, fileName);
  };

  const copy = async () => {
    const str = JSON.stringify(flow, null, 4);
    await navigator.clipboard.writeText(str);
    toastMsg("Copied");
  };

  const copyPart = async () => {
    const str = JSON.stringify(props.part, null, 4);
    await navigator.clipboard.writeText(str);
    toastMsg("Copied");
  };

  const editRawPart = async () => {
    const partStr = JSON.stringify(props.part, null, 4);
    const newPartStr = prompt("New part?", partStr);
    try {
      const newPart: CustomPart = JSON.parse(newPartStr || "");
      if (newPart.id && newPart.inputs && newPart.outputs) {
        onOverrideEditedPart(newPart);
      }
    } catch (e) {
      toastMsg("Invalid part, not saved", "warning");
    }
  };

  const history = useHistory();
  const goToDashboard = () => {
    history.push(`/projects`);
  };
  
  const exportPart = async () => {
    const parts = getPartWithDependencies(props.part, flow.parts);

    const partStr = JSON.stringify(parts, null, 4);

    await navigator.clipboard.writeText(partStr);

    toastMsg(parts.length === 1 ? "Copied" : `Copied part and ${parts.length - 1} dependencies`);
  };

  const importPart = React.useCallback(() => {
    const partStr = prompt("Part json?") || "";
    try {
      const newPart = JSON.parse(partStr);

      const parts: CustomPart[] = isDefined(newPart.length) ? newPart : [newPart];
      const valid = parts.every((p) => p.id && p.inputs && p.outputs);

      if (valid) {
        const newProj = produce(flow, (draft) => {
          parts.forEach((p) => {
            draft.parts[p.id] = p;
          });
        });
        onChangeProject(newProj, functionalChange("part import"));

        toastMsg(
          parts.length === 1 ? "Imported" : `Imported part and ${parts.length - 1} dependencies`
        );

        // onChangeEditedPart(parts[0].id);
      }
    } catch (e) {
      toastMsg("Invalid part, not saved", "warning");
    }
  }, [onChangeProject, flow]);

  const ProjectMenu = (
    <Menu>
      <MenuItem text="Dashboard" onClick={goToDashboard} />
      {/* <MenuItem text="Connect to external" onClick={onInnerConnect} /> */}
      <MenuItem text="Download File" onClick={download} />
      <MenuItem text="Copy project to clipboard" onClick={copy} />
      <MenuItem text="Copy part to clipboard" onClick={copyPart} />
      <MenuItem text="Edit raw part (internal usage)" onClick={editRawPart} />
      <MenuItem text="Import Part(s) from JSON" onClick={importPart} />
      <MenuItem text="Export Part(s) to JSON" onClick={exportPart} />
    </Menu>
  );

  return (
    <header className="integrated-flow-header">
      <Popover content={ProjectMenu} position={Position.RIGHT_BOTTOM}>
        <span className="project-name">
          <img className="logo" src={logo} alt="Flyde logo" />
        </span>
      </Popover>
      {/* <em className="last-saved">Last saved {timeAgo(props.project.updated)}</em> */}
      <Breadcrumbs
        flow={flow}
        relationshipData={props.relationshipData}
        onEditPart={onChangeEditedPart}
        editedPart={props.part}
      />
      <aside/> {/* for spacing */}
    </header>
  );
});
