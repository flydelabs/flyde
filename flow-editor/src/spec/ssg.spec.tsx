import {
  connectionData,
  visualNode,
  nodeInput,
  nodeInstance,
  nodeOutput,
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
      instances: [nodeInstance("i1", id), nodeInstance("i2", id)],
      connections: [connectionData("i1.r", "i2.a")],
    });
    const props: FlydeFlowEditorProps = {
      state: {
        flow: {
          imports: {},
          node,
        },
        boardData: {
          selectedInstances: [],
          viewPort: defaultViewPort,
          lastMousePos: { x: 0, y: 0 },
          selectedConnections: [],
        },
      },
      onChangeEditorState: noop,
      onExtractInlineNode: noop as any,
    };

    let s = "";
    assert.doesNotThrow(() => {
      const comp = <FlowEditor {...props} />;
      s = ReactDOMServer.renderToString(comp);
      // assert.notInclude(s, 'Error')
    });

    assert.notInclude(s, "Error");
  });
});
