import { noop, NodeDefinition, partInstance } from "@flyde/core";
import React from "react";
import {
  InstanceView,
  InstanceViewProps,
} from "../visual-part-editor/instance-view/InstanceView";

export const NodePreview: React.FC<{ part: NodeDefinition }> = ({ part }) => {
  const ins = partInstance("bob", part.id, {});
  const instanceProps: InstanceViewProps = {
    part,
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
    onExtractInlinePart: noop as any,
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
    <div className="part-preview">
      <InstanceView {...instanceProps} />
    </div>
  );
};
