import {
  connectionData,
  visualNode,
  nodeInput,
  partInstance,
  nodeOutput,
} from "@flyde/core";
import { assert } from "chai";
import { noop } from "lodash";
import * as ReactDOMServer from "react-dom/server";

import { FlowEditor } from "..";
import { FlydeFlowEditorProps } from "../flow-editor/FlowEditor";
import { defaultViewPort } from "../visual-part-editor";

describe("ssg/ssr support", () => {
  beforeEach(() => {
    assert.equal(typeof document, "undefined");
  });

  it("renders into string without throwing in the absence of DOM", () => {
    const id = "part";
    const part = visualNode({
      id,
      inputs: { a: nodeInput() },
      outputs: { r: nodeOutput() },
      instances: [partInstance("i1", id), partInstance("i2", id)],
      connections: [connectionData("i1.r", "i2.a")],
    });
    const props: FlydeFlowEditorProps = {
      state: {
        flow: {
          imports: {},
          part,
        },
        boardData: {
          selected: [],
          viewPort: defaultViewPort,
          lastMousePos: { x: 0, y: 0 },
        },
      },
      onChangeEditorState: noop,
      hideTemplatingTips: false,
      onExtractInlinePart: noop as any,
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
