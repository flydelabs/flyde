import {
  Classes,
  Collapse,
  TreeNodeInfo,
  Tree,
  TreeEventHandler,
} from "@blueprintjs/core";
import React, { useCallback, useEffect } from "react";

import "./styles.scss";

import { FolderStructure, FileOrFolder } from "@flyde/dev-server";
import { useDevServerApi } from "../../../api/dev-server-api";
import { Loader } from "@flyde/flow-editor"; // ../../../../common/lib/loader
import { useNavigate } from "react-router-dom";
import { NewFlowModal } from "./NewFlowModal/NewFlowModal";
import {
  BaseNode,
  CustomNode,
  FlydeFlow,
  visualNode,
  nodeOutput,
} from "@flyde/core";

export interface FoldersSectionProps {
  currentFile: string;
  flow: FlydeFlow;

  // data: NavigatorData;
  editedNode: CustomNode;

  // onEditNode: (nodeId: string) => void;
  onFocusInstance: (nodeId: string) => void;
}

const toTreeNode = (
  fileOrFolder: FileOrFolder,
  expanded: Set<string>,
  selected: Set<string>
): TreeNodeInfo<FileOrFolder> => {
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
      childNodes: [
        ...fileOrFolder.children.map((c) => toTreeNode(c, expanded, selected)),
      ],
    };
  } else {
    return {
      ...base,
      disabled: !fileOrFolder.isFlyde,
    };
  }
};

const calcExpanded = (currentFile: string): Set<any> => {
  const fileParents = currentFile
    .split("/")
    .map((_, i, arr) => arr.slice(0, i).join("/"));
  return new Set(fileParents);
};

export const FoldersSection: React.FC<FoldersSectionProps> = (props) => {
  const [structure, setStructure] = React.useState<FolderStructure>();
  const devClient = useDevServerApi();

  const [expanded, setExpanded] = React.useState(
    calcExpanded(props.currentFile)
  );
  const [selected] = React.useState(new Set<string>([props.currentFile]));

  const [newFlowTarget, setNewFlowTarget] = React.useState<string>();

  const [foldersExpanded, setFoldersExpanded] = React.useState(true);

  const toggleFolders = useCallback(
    () => setFoldersExpanded(!foldersExpanded),
    [foldersExpanded]
  );

  const navigate = useNavigate();

  useEffect(() => {
    devClient.fileStructure().then(setStructure);
  }, [devClient]);

  const onExpand: TreeEventHandler<FileOrFolder> = React.useCallback((node) => {
    setExpanded((e) => {
      return new Set(e.add(node.id));
    });
  }, []);

  const onCollapse: TreeEventHandler<FileOrFolder> = React.useCallback(
    (node) => {
      setExpanded((e) => {
        e.delete(node.id);
        return new Set(e);
      });
    },
    []
  );

  // const onCreateFlowHere = (data: FileOrFolder) => {
  //   setNewFlowTarget(data.relativePath);
  // };

  const onNodeContextMenu: TreeEventHandler<FileOrFolder> = React.useCallback(
    (node, _, e) => {
      const data = node.nodeData;

      if (!data) {
        return;
      }

      e.preventDefault();

      // if (data.isFolder) {
      //   const menu = (
      //     <Menu>
      //       <MenuItem
      //         text={`Add new flow here`}
      //         onClick={() => onCreateFlowHere(data)}
      //         // onClick={preventDefaultAnd(() => onAddIoPin("input"))}
      //         // disabled={!nodeIoEditable}
      //       />
      //     </Menu>
      //   );
      //   ContextMenu.show(menu, { left: e.pageX, top: e.pageY });
      // } else {
      //   const menu = (
      //     <Menu>
      //       <MenuItem
      //         label={`Duplicate flow`}
      //         onClick={() => toastMsg("Bob " + data?.fullPath)}
      //         // onClick={preventDefaultAnd(() => onAddIoPin("input"))}
      //         // disabled={!nodeIoEditable}
      //       />
      //       <MenuItem
      //         label={`Delete flow`}
      //         intent="danger"
      //         onClick={() => toastMsg("Bob " + data?.fullPath)}
      //         // onClick={preventDefaultAnd(() => onAddIoPin("input"))}
      //         // disabled={!nodeIoEditable}
      //       />
      //     </Menu>
      //   );
      //   ContextMenu.show(menu, { left: e.pageX, top: e.pageY });
      // }
    },
    []
  );

  const onNodeClick: TreeEventHandler<FileOrFolder> = React.useCallback(
    (node) => {
      const data = node.nodeData;
      if (data && !data.isFolder && data.isFlyde) {
        navigate(`/files?fileName=${data.relativePath}`);
      }
    },
    [navigate]
  );

  const onCreateFlow = useCallback(
    (baseNode: BaseNode) => {
      const node = visualNode(baseNode);
      node.outputs = { result: nodeOutput() };
      const path = newFlowTarget + "/" + node.id;

      node.id = "Main";
      node.completionOutputs = ["result"];

      const flow: FlydeFlow = {
        imports: {},
        node: node,
      };
      devClient.saveFile(path, flow);

      navigate(`/files?fileName=${path}`);
    },
    [devClient, newFlowTarget, navigate]
  );

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
        <FlowNodesSection {...props}/>
      </Collapse> */}

      {newFlowTarget ? (
        <NewFlowModal
          onCreate={onCreateFlow}
          folder={newFlowTarget}
          onCancel={() => setNewFlowTarget(undefined)}
        />
      ) : null}
    </div>
  );
};
