import { noop, NodeDefinition, nodeInstance } from "@flyde/core";
import React from "react";
import {
  InstanceView,
  InstanceViewProps,
} from "../visual-node-editor/instance-view/InstanceView";

export const NodePreview: React.FC<{ node: NodeDefinition }> = ({ node }) => {
  const ins = nodeInstance("bob", node.id, {});
  const instanceProps: InstanceViewProps = {
    node,
    instance: ins,
    connections: [],
    viewPort: { pos: { x: 0, y: 0 }, zoom: 1 },
    resolvedDeps: {},
    connectionsPerInput: {},
    onUngroup: noop,
    onDblClick: noop,
    onDragEnd: noop,
    onDragMove: noop,
    onDragStart: noop,
    onPinClick: noop,
    onPinDblClick: noop,
    onSelect: noop,
    onTogglePinBreakpoint: noop,
    onTogglePinLog: noop,
    onToggleSticky: noop,
    displayMode: true,
    onInspectPin: noop,
    onDetachConstValue: noop,
    onCopyConstValue: noop,
    onPasteConstValue: noop,
    ancestorsInsIds: "",
    onChangeVisibleInputs: noop,
    onChangeVisibleOutputs: noop,
    onConvertConstToEnv: noop,
    forceShowMinimized: "both",
    onExtractInlineNode: noop as any,
    onCloseInlineEditor: noop,
    isConnectedInstanceSelected: false,
    inlineEditorPortalDomNode: null as any,
    onChangeStyle: noop,
    onDeleteInstance: noop,
    onGroupSelected: noop,
    onSetDisplayName: noop,
    hadError: false,
    queuedInputsData: {},
    onPinMouseDown: noop,
    onPinMouseUp: noop,
  };

  return (
    <div className="node-preview">
      <InstanceView {...instanceProps} />
    </div>
  );
};
