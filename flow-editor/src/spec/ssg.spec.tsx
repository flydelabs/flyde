import {
  connectionData,
  visualNode,
  nodeInput,
  nodeInstance,
  nodeOutput,
  EditorNode,
} from "@flyde/core";
import { assert } from "chai";
import { noop } from "lodash";
import * as ReactDOMServer from "react-dom/server";

import { FlowEditor } from "..";
import { FlydeFlowEditorProps } from "../flow-editor/FlowEditor";
import { defaultViewPort } from "../visual-node-editor";

describe("ssg/ssr support", () => {
  beforeEach(() => {
    assert.equal(typeof document, "undefined");
  });

  it("renders into string without throwing in the absence of DOM", () => {
    const id = "node";
    const node = visualNode({
      id,
      inputs: { a: nodeInput() },
      outputs: { r: nodeOutput() },
      instances: [
        nodeInstance("i1", id, { type: "package", data: {} }),
        nodeInstance("i2", id, { type: "package", data: {} }),
      ],
      connections: [connectionData("i1.r", "i2.a")],
    });
    const dummyNode: EditorNode = {
      id: 'dummy',
      inputs: {},
      outputs: {},
      inputsPosition: {},
      outputsPosition: {},
      connections: [],
      instances: [],

    }
    const editorNode = {
      ...node,
      instances: node.instances.map((i) => ({
        ...i,
        node: dummyNode
      })),
    };
    const props: FlydeFlowEditorProps = {
      state: {
        flow: {
          node: editorNode,
        },
        boardData: {
          selectedInstances: [],
          viewPort: defaultViewPort,
          lastMousePos: { x: 0, y: 0 },
          selectedConnections: [],
        },
      },
      onChangeEditorState: noop,
    };

    let s = "";
    assert.doesNotThrow(() => {
      const comp = <FlowEditor {...props} />;
      s = ReactDOMServer.renderToString(comp as any);
      // assert.notInclude(s, 'Error')
    });

    assert.notInclude(s, "Error");
  });
});
