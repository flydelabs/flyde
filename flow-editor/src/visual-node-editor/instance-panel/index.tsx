// import {
//   ConnectionData,
//   NodeDefinition,
//   nodeInput,
//   NodeInstance,
//   queueInputPinConfig,
//   removeDupes,
//   TRIGGER_PIN_ID,
// } from "@flyde/core";
// import React, { useCallback } from "react";
// import { Resizable } from "react-resizable";
// import { useUserPref } from "../../lib/user-preferences";
// import { keys } from "../../utils";

// // ;
// import { Card, Switch } from "@blueprintjs/core";
// import produce from "immer";

// import { InstancePanelInputPinView } from "./InstancePanelInputPinView";

// export interface InstancePanelProps {
//   instance: NodeInstance;
//   node: NodeDefinition;
//   connections: ConnectionData[];
//   onChangeInstanceConfig: (newInstanceConfig: NodeInstance, comment: string) => void;
// }
// const handle = <div className="resizer" />;

// export const InstancePanel: React.FC<InstancePanelProps> = (props) => {
//   const { instance, node, onChangeInstanceConfig } = props;
//   const { inputConfig, id } = instance;
//   const inputs = keys(node.inputs);

//   const [width, setWidth] = useUserPref("instance-panel.width", 220);

//   const _onChangeConfig = useCallback(
//     (pinId, config) => {
//       const changed = produce(instance, (draft) => {
//         draft.inputConfig[pinId] = config;
//       });
//       onChangeInstanceConfig(changed, `Changed ${pinId} config`);
//       // onChangeConfig(instance, pinId);
//     },
//     [instance, onChangeInstanceConfig]
//   );

//   const onToggleVisible = useCallback(
//     (pinId, visible) => {
//       const changed = produce(instance, (draft) => {
//         const before =
//           draft.visibleInputs || getDefaultVisibleInputs(instance, node, props.connections);
//         const after = visible ? [...before, pinId] : before.filter((id) => id !== pinId);
//         draft.visibleInputs = removeDupes(after);
//       });
//       onChangeInstanceConfig(changed, `Changed ${pinId} visibility to ${visible}`);
//     },
//     [instance, onChangeInstanceConfig, node, props.connections]
//   );

//   const visibleInputs =
//     instance.visibleInputs || getDefaultVisibleInputs(instance, node, props.connections);

//   const triggerConnected = props.connections.some(
//     (c) => c.to.insId === instance.id && c.to.pinId === TRIGGER_PIN_ID
//   );
//   const triggerVisible = visibleInputs.includes(TRIGGER_PIN_ID);

//   const onChangeTriggerVisible = useCallback(
//     (e: any) => {
//       const changed = produce(instance, (draft) => {
//         draft.visibleInputs = e.target.checked
//           ? [...visibleInputs, TRIGGER_PIN_ID]
//           : visibleInputs.filter((p) => p !== TRIGGER_PIN_ID);
//       });
//       onChangeInstanceConfig(changed, `Changed trigger visibility to ${e.target.checked}`);
//     },
//     [instance, onChangeInstanceConfig, visibleInputs]
//   );

//   return (
//     <div className="instance-panel" style={{ width }}>
//       <div className="instance-panel-inner">
//         <Resizable
//           width={width}
//           height={0}
//           handle={handle}
//           onResize={(_, data) => setWidth(data.size.width)}
//           axis="x"
//           // handle={handle}
//           resizeHandles={["w"]}
//           minConstraints={[0, 0]}
//           maxConstraints={[800, 0]}
//         >
//           <React.Fragment>
//             {/* <h2>Instance Panel</h2> */}
//             <h3 className="bp5-heading">Inputs</h3>
//             {inputs.map((pinId) => (
//               <InstancePanelInputPinView
//                 visible={visibleInputs.includes(pinId)}
//                 key={pinId}
//                 id={pinId}
//                 config={inputConfig[pinId] || queueInputPinConfig()}
//                 pin={node.inputs[pinId] || nodeInput()}
//                 onToggleVisible={onToggleVisible}
//                 onChangeConfig={_onChangeConfig}
//                 connected={props.connections.some((c) => c.to.pinId === pinId)}
//               />
//             ))}

//             <Card>
//               <h5 className="bp5-heading">
//                 <span>Trigger Pin</span>{" "}
//                 <Switch
//                   checked={triggerVisible}
//                   disabled={triggerConnected && triggerVisible}
//                   inline
//                   onChange={onChangeTriggerVisible}
//                   innerLabel="Hidden"
//                   innerLabelChecked="Visible"
//                 />
//               </h5>
//             </Card>
//             {/* <h3>Outputs</h3> */}
//           </React.Fragment>
//         </Resizable>
//       </div>
//     </div>
//   );
// };
