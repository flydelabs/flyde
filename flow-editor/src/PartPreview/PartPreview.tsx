import { noop, PartDefinition, partInstance } from "@flyde/core";
import React from "react";
import { InstanceView, InstanceViewProps } from "../grouped-part-editor/instance-view/InstanceView";

export const PartPreview: React.FC<{part: PartDefinition}> = ({part}) => {
    const ins = partInstance("bob", part.id, {});
    const instanceProps: InstanceViewProps = {
      part,
      instance: ins,
      connections: [],
      connectionsPerInput: {},
      connectionsPerOutput: {},
      viewPort: { pos: { x: 0, y: 0 }, zoom: 1 },
      partDefRepo: {},
      onDismantleGroup: noop,
      onDoubleClick: noop,
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
      onRequestHistory: noop as any,
      parentInsId: '',
      onChangeVisibleInputs: noop,
      onChangeVisibleOutputs: noop,
      onConvertConstToEnv: noop,
      forceShowMinimized: 'both'
    };
  
    return <div className='part-preview'><InstanceView {...instanceProps} /></div>;
}