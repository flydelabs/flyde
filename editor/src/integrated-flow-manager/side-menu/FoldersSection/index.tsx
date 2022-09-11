import {
  Classes,
  Collapse,
  ContextMenu,
  ITreeNode,
  Menu,
  MenuItem,
  Tree,
  TreeEventHandler,
} from "@blueprintjs/core";
import React, { useCallback, useEffect } from "react";

import "./styles.scss";

import { FolderStructure, FileOrFolder } from "@flyde/dev-server";
import { useDevServerApi } from "../../../api/apis-context";
import { Loader } from "@flyde/flow-editor"; // ../../../../common/lib/loader
import { toastMsg } from "@flyde/flow-editor"; // ../../../../common/toaster
import { useHistory } from "react-router-dom";
import { NewFlowModal } from "./NewFlowModal/NewFlowModal";
import { BasePart, CustomPart, FlydeFlow, groupedPart, partOutput } from "@flyde/core";

export interface FoldersSectionProps {
  currentFile: string;
  flow: FlydeFlow;

  // data: NavigatorData;
  editedPart: CustomPart;
  
  // onEditPart: (partId: string) => void;
  onFocusInstance: (partId: string) => void;
}

const toTreeNode = (
  fileOrFolder: FileOrFolder,
  expanded: Set<string>,
  selected: Set<string>
): ITreeNode<FileOrFolder> => {
  const base = {
    label: fileOrFolder.name,
    id: fileOrFolder.relativePath,
    isExpanded: expanded.has(fileOrFolder.relativePath),
    isSelected: selected.has(fileOrFolder.relativePath),
    nodeData: fileOrFolder,
  };

  if (fileOrFolder.isFolder) {
    return {
      ...base,
      childNodes: [...fileOrFolder.children.map((c) => toTreeNode(c, expanded, selected))],
    };
  } else {
    return {
      ...base,
      disabled: !fileOrFolder.isFlyde,
    };
  }
};

const calcExpanded = (currentFile: string): Set<any> => {
  const fileParents = currentFile.split('/')
      .map((_, i, arr) => arr.slice(0, i).join('/'));
  return new Set(fileParents);
};

export const FoldersSection: React.FC<FoldersSectionProps> = (props) => {
  const [structure, setStructure] = React.useState<FolderStructure>();
  const devClient = useDevServerApi();

  const [expanded, setExpanded] = React.useState(calcExpanded(props.currentFile));
  const [selected] = React.useState(new Set<string>([props.currentFile]));

  const [newFlowTarget, setNewFlowTarget] = React.useState<string>();

  const [foldersExpanded, setFoldersExpanded] = React.useState(true);
  const [flowsExpanded, setFlowsExpanded] = React.useState(true);

  const toggleFolders = useCallback(() => setFoldersExpanded(!foldersExpanded), [
    foldersExpanded,
  ]);

  const history = useHistory();

  useEffect(() => {
    devClient.fileStructure().then(setStructure);
  }, [devClient]);

  const onExpand: TreeEventHandler<FileOrFolder> = React.useCallback((node) => {
    setExpanded((e) => {
      return new Set(e.add(node.id));
    });
  }, []);

  const onCollapse: TreeEventHandler<FileOrFolder> = React.useCallback((node) => {
    setExpanded((e) => {
      e.delete(node.id);
      return new Set(e);
    });
  }, []);

  const onCreateFlowHere = (data: FileOrFolder) => {
    setNewFlowTarget(data.relativePath);
  }

  const onNodeContextMenu: TreeEventHandler<FileOrFolder> = React.useCallback((node, _, e) => {
    const data = node.nodeData;

    if (!data) {
      return;
    }

    e.preventDefault();

	if (data.isFolder) {
		const menu = (
			<Menu>
			  <MenuItem
				label={`Add new flow here`}
				onClick={() => onCreateFlowHere(data)}
				// onClick={preventDefaultAnd(() => onAddIoPin("input"))}
				// disabled={!partIoEditable}
			  />
			</Menu>
		  );
		  ContextMenu.show(menu, { left: e.pageX, top: e.pageY });
	} else {
		const menu = (
			<Menu>
			  <MenuItem
				label={`Duplicate flow`}
				onClick={() => toastMsg("Bob " + data?.fullPath)}
				// onClick={preventDefaultAnd(() => onAddIoPin("input"))}
				// disabled={!partIoEditable}
			  />
			  <MenuItem
				label={`Delete flow`}
				intent="danger"
				onClick={() => toastMsg("Bob " + data?.fullPath)}
				// onClick={preventDefaultAnd(() => onAddIoPin("input"))}
				// disabled={!partIoEditable}
			  />
			</Menu>
		  );
		  ContextMenu.show(menu, { left: e.pageX, top: e.pageY });
	}
  }, []);

  const onNodeClick: TreeEventHandler<FileOrFolder> = React.useCallback((node) => {
    const data = node.nodeData;
    if (data && !data.isFolder && data.isFlyde) {
      history.push(`/files?fileName=${data.relativePath}`);
    }
  }, [history]);

  const onCreateFlow = useCallback((basePart: BasePart) => { 
    const part = groupedPart(basePart);
    part.outputs = {result: partOutput('any')};
    const path = newFlowTarget + '/' + part.id;

    part.id = 'Main';
    part.completionOutputs = ['result'];

    const flow: FlydeFlow = {
      imports: {},
      part: part
    }
    devClient.saveFile(path, flow);

    history.push(`/files?fileName=${path}`);
  }, [devClient, newFlowTarget, history]);

  if (!structure) {
    return <Loader />;
  }

  const items = [...structure.map((f) => toTreeNode(f, expanded, selected))];


  return (
    <div className="folders-section">
      <h4 onClick={toggleFolders}>Files</h4>
      <Collapse isOpen={foldersExpanded}>
      <Tree
        contents={items}
        onNodeExpand={onExpand}
        onNodeCollapse={onCollapse}
        onNodeContextMenu={onNodeContextMenu}
        // onNodeExpand={onExpand}
        // onNodeCollapse={onCollapse}
        onNodeClick={onNodeClick}
        // onNodeDoubleClick={onDblClickNode}
        // onNodeContextMenu={onNodeContextMenu}
        // onNodeClick={handleNodeClick}
        // onNodeCollapse={handleNodeCollapse}
        // onNodeExpand={handleNodeExpand}
        className={Classes.ELEVATION_0}
      />
      </Collapse>
      {/* <h4 onClick={toggleFlows}>Current Flow - {props.currentFile} </h4>
      <Collapse isOpen={flowsExpanded}>
        <FlowPartsSection {...props}/>
      </Collapse> */}


      {newFlowTarget ? <NewFlowModal onCreate={onCreateFlow} folder={newFlowTarget} onCancel={() => setNewFlowTarget(undefined)} /> : null}
    </div>
  );
};
