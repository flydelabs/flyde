import {
  OMap,
  OMapF,
  entries,
  isDefined,
  testDataCreator,
  noop,
  Pos,
} from "../common";
import { Subject } from "rxjs";

import { CancelFn, InnerExecuteFn } from "../execute";
import { ConnectionData } from "../connect";
import {
  isInlineNodeInstance,
  NodeInstance,
  RefNodeInstance,
  ResolvedMacroNodeInstance,
  ResolvedNodeInstance,
} from "./node-instance";
import {
  InputPin,
  InputPinMap,
  OutputPin,
  OutputPinMap,
  nodeInput,
  nodeOutput,
} from "./node-pins";
import { ImportedNode } from "../flow-schema";

export type NodesCollection = OMap<Node>;

export type NodesDefCollection = OMap<NodeDefinition>;

export type CustomNodeCollection = OMap<CustomNode>;

export type NodeState = Map<string, any>;

export type NodeAdvancedContext = {
  execute: InnerExecuteFn;
  insId: string;
  ancestorsInsIds?: string;
  state: NodeState;
  globalState: NodeState;
  onCleanup: (cb: Function) => void;
  onError: (e: any) => void;
  context: Record<string, any>;
};

export type RunNodeFunction = (
  args: OMapF<any>,
  o: OMapF<Subject<any>>,
  adv: NodeAdvancedContext
) => void | CancelFn | Promise<void | CancelFn>;

export type CustomNodeViewFn = (
  instance: NodeInstance,
  inputs: OMap<NodeInstance[]>,
  outputs: OMap<NodeInstance[]>,
  resolvedDeps: NodesDefCollection
) =>
  | {
      label: string;
      hiddenInputs?: string[];
      hiddenOutputs?: string[];
    }
  | false;

export type NodeStyleSize = "small" | "regular" | "large";
export type NodeTypeIcon = string | [string, string];

export interface NodeStyle {
  icon?: NodeTypeIcon;
  size?: NodeStyleSize;
  color?: string | [string, string];
  cssOverride?: Record<string, string>;
}

/**
 * Extended by {@link VisualNode}, {@link CodeNode} and {@link InlineValueNode}
 */
export interface BaseNode {
  /**
   * Node's unique id. {@link VisualNode.instances }  refer use this to refer to the correct node
   */
  id: string;

  /**
   * A human readable name for the node. Used in the visual editor.
   */
  displayName?: string;
  /**
   * Is displayed in the visual editor and used to search for nodes.
   */
  description?: string;
  /**
   * A list of keywords that can be used to search for the node. Useful for node that users might search using different words.
   */
  searchKeywords?: string[];
  /**
   * A pin on a node that receives data. Each node can have zero or more input pins.
   *
   * Example for the inputs of a mathematical multiplier node:
   * ```ts
   * {
   *  multiplicand: { description: "The number to be multiplied" },
   *  multiplier: { description: "The number with which we multiply" },
   * }
   * ```
   */
  inputs: Record<string, InputPin>;
  /**
   * A pin on a node that sends data. Each node can have zero or more output pins.
   * For example, a "Split array" node might have one input pin for an array and two output pins for the first and second halves of the array:
   *
   * @example
   * ```ts
   * {
   *  'first half': { description: "The first half of the array" },
   *  'second half': { description: "The second half of the array" },
   * }
   * ```
   */
  outputs: Record<string, OutputPin>;
  /**
   * TBD
   */
  namespace?: string;
  /**
   * Instructs Flyde that the node is in "explicit completion" mode and describes which outputs trigger the node's completion. Receives a list of outputs that should trigger an explicit completion of the node when they emit a value. Any of the listed outputs will trigger a completion (i.e. completionOutput[0] `OR` completionOutput[1])
   * Leave empty for implicit completion. This should work best for 99% of the case.
   *
   * To declare that 2 different outputs must emit a value in order to trigger a completion, different outputs can be joined together with a `+` sign as following:
   * ``` ts
   * {
   * ...
   *  completionOutputs: ["data+headers", "error"] // this means either data AND headers, OR "error" will trigger an explicit completion.
   * ```
   *
   * See the [Nodes lifecycle](/docs/lifecycle) for more info
   */
  completionOutputs?: string[];
  /**
   * @deprecated - TBD
   */
  reactiveInputs?: string[];
  /**
   * Supply a custom string template (in [Handlebars](https://https://handlebarsjs.com/) format) to control how an instance of this node will be rendered in the visual editor.
   * The template has access to static values, making it possible to expose valuable information in the instance itself:
   * @example
   * A "Delay" node has 2 inputs: value and a time. In many cases, the `time` input will be provided statically.
   * It can be convenient to show the time input in the instance itself so it shows "Delay 500ms" instead of "Delay" (in the case 500 is the static value of `time`)
   *
   * ```
   * {
   *   ...,
   *   customViewCode: `{{#if inputs.time}}
  Delay {{inputs.time}} ms
{{else}}
  Delay
{{/if}}`
   * }
   * ```
   *
   */
  customViewCode?: string;
  /**
   * All instances of this node will inherit the default style if it is supplied.
   * See {@link NodeStyle} for the full options supported
   */
  defaultStyle?: NodeStyle;
}

export interface CodeNode extends BaseNode {
  /**
   * This function will run as soon as the node's inputs are satisfied.
   * It has access to the nodes inputs values, and output pins. See {@link RunNodeFunction} for more information.
   *
   */
  run: RunNodeFunction;
  /**
   * @deprecated use {@link CodeNode['run']} instead
   */
  fn?: RunNodeFunction;
  customView?: CustomNodeViewFn;
}

export interface MacroNode<T> {
  id: string;
  displayName?: string;
  namespace?: string;
  defaultStyle?: NodeStyle;
  description?: string;
  definitionBuilder: (data: T) => Omit<CodeNodeDefinition, "id">;
  runFnBuilder: (data: T) => CodeNode["run"];
  defaultData: T;

  /**
   * Assumes you are bundling the editor component using webpack library+window config.
   * The name of the window variable that holds the component should be __MacroNode__{id}
   * The path should be relative to the root of the project (package.json location)
   */
  editorComponentBundlePath: string;
}

export type MacroNodeDefinition<T> = Omit<
  MacroNode<T>,
  "definitionBuilder" | "runFnBuilder" | "editorComponentBundlePath"
> & {
  /**
   * Resolver will use this to load the editor component bundle into the editor
   */
  editorComponentBundleContent: string;
};

export enum InlineValueNodeType {
  VALUE = "value",
  FUNCTION = "function",
}

/**
 * InlineValueNode is used by the editor to create inline values and function.
 * @deprecated will turn into a "Macro Node" as soon as that is developed
 */

export interface InlineValueNode extends BaseNode {
  runFnRawCode: string;
  fnCode?: string;
  dataBuilderSource?: string; // quick solution for "Data builder iteration"
  templateType?: InlineValueNodeType;
}

/**
 * A visual node is what makes Flyde special. It represents a node created visually in the editor.
 * It consists of node instances and connections. Each node instance will either refer to an imported node (by id), or include the node "inline".
 * Each connection will represent a "wire" between 2 instances, or between an instance and a main input/output pin.
 * Connecting to a main input or output is the way that a visual nodes' internal implementation can communicate with its external API.
 */

export interface VisualNode extends BaseNode {
  /** a map holding the position for each main input. Used in the editor only. */
  inputsPosition: OMap<Pos>;
  /** a map holding the position for each main output. Used in the editor only. */
  outputsPosition: OMap<Pos>;
  /** the visual nodes internal node instances, either referring to other nodes by id or by value (inline) */
  instances: NodeInstance[];
  /** each connection represents a "wire" between 2 different instances, or between an instance and a main input/output*/
  connections: ConnectionData[];
  /** TODO - either deprecate this or {@link BaseNode.customViewCode} */
  customView?: CustomNodeViewFn;
}

export interface ResolvedVisualNode extends VisualNode {
  instances: ResolvedNodeInstance[];
}

export type Node = CodeNode | CustomNode;

export type ImportableSource = {
  module: string;
  node: ImportedNode;
  implicit?: boolean;
};

export type CustomNode = VisualNode | InlineValueNode;

export type CodeNodeDefinition = Omit<CodeNode, "run">;

export type NodeDefinition = CustomNode | CodeNodeDefinition;
export type NodeOrMacroDefinition = NodeDefinition | MacroNodeDefinition<any>;

export type NodeModuleMetaData = {
  imported?: boolean;
};

export type NodeDefinitionWithModuleMetaData = NodeDefinition &
  NodeModuleMetaData;

export const isBaseNode = (p: any): p is BaseNode => {
  return p && p.id && p.inputs && p.outputs;
};

export const isCodeNode = (p: Node | NodeDefinition | any): p is CodeNode => {
  return isBaseNode(p) && typeof (p as CodeNode).run === "function";
};

export const isMacroNode = (p: any): p is MacroNode<any> => {
  return p && typeof (p as MacroNode<any>).runFnBuilder === "function";
};

export const isMacroNodeDefinition = (
  p: any
): p is MacroNodeDefinition<any> => {
  return (
    p &&
    typeof (p as MacroNodeDefinition<any>).editorComponentBundleContent ===
      "string"
  );
};

export const isVisualNode = (p: Node | NodeDefinition): p is VisualNode => {
  return !!(p as VisualNode).instances;
};

export const isInlineValueNode = (
  p: Node | NodeDefinition | undefined
): p is InlineValueNode => {
  return isDefined(p) && isDefined((p as InlineValueNode).runFnRawCode);
};

export const visualNode = testDataCreator<VisualNode>({
  id: "visual-node",
  inputs: {},
  outputs: {},
  instances: [],
  connections: [],
  outputsPosition: {},
  inputsPosition: {},
});

export const codeNode = testDataCreator<CodeNode>({
  id: "node",
  inputs: {},
  outputs: {},
  run: noop as any,
});

export const inlineValueNode = testDataCreator<InlineValueNode>({
  id: "node",
  inputs: {},
  outputs: {},
  runFnRawCode: "",
});

export type SimplifiedNodeParams = {
  id: string;
  inputTypes: OMap<string>;
  outputTypes: OMap<string>;
  run: RunNodeFunction;
};

export const fromSimplified = ({
  run,
  inputTypes,
  outputTypes,
  id,
}: SimplifiedNodeParams): CodeNode => {
  const inputs: InputPinMap = entries(inputTypes).reduce<InputPinMap>(
    (p, [k]) => ({ ...p, [k]: {} }),
    {}
  );
  const outputs: OutputPinMap = entries(outputTypes).reduce<InputPinMap>(
    (p, [k]) => ({ ...p, [k]: {} }),
    {}
  );
  return {
    id,
    inputs,
    outputs,
    run,
  };
};

export const maybeGetStaticValueNodeId = (value: string) => {
  const maybeNodeMatch =
    typeof value === "string" && value.match(/^__node\:(.*)/);
  if (maybeNodeMatch) {
    const nodeId = maybeNodeMatch[1];
    return nodeId;
  }
  return null;
};
export const getStaticValue = (
  value: any,
  resolvedDeps: NodesDefCollection,
  calleeId: string
) => {
  const maybeNodeId = maybeGetStaticValueNodeId(value);
  if (maybeNodeId) {
    const node = resolvedDeps[maybeNodeId];
    if (!node) {
      throw new Error(
        `Instance ${calleeId} referrer to a node reference ${maybeNodeId} that does not exist`
      );
    }
    return node;
  } else {
    return value;
  }
};

export const getNode = (
  idOrIns: string | NodeInstance,
  resolvedNodes: NodesCollection
): Node => {
  const isOrInsResolved = idOrIns as string | ResolvedNodeInstance; // ugly type hack to avoid fixing the whole Resolved instances cases caused by macros. TODO: fix this by refactoring all places to use "ResolvedNodeInstance"
  if (
    typeof isOrInsResolved !== "string" &&
    isInlineNodeInstance(isOrInsResolved)
  ) {
    return isOrInsResolved.node;
  }
  const id =
    typeof isOrInsResolved === "string"
      ? isOrInsResolved
      : isOrInsResolved.nodeId;

  const node = resolvedNodes[id];
  if (!node) {
    throw new Error(`Node with id ${id} not found`);
  }
  return node;
};

export const getNodeDef = (
  idOrIns: string | NodeInstance,
  resolvedNodes: NodesDefCollection
): NodeDefinition => {
  if (typeof idOrIns !== "string" && isInlineNodeInstance(idOrIns)) {
    return idOrIns.node;
  }
  const id =
    typeof idOrIns === "string"
      ? idOrIns
      : (idOrIns as RefNodeInstance | ResolvedMacroNodeInstance).nodeId;
  const node = resolvedNodes[id];
  if (!node) {
    console.error(`Node with id ${id} not found`);
    throw new Error(`Node with id ${id} not found`);
  }
  return node;
};

export type codeFromFunctionParams = {
  id: string;
  fn: Function;
  inputNames: string[];
  outputName: string;
  defaultStyle?: NodeStyle;
};

export const codeFromFunction = ({
  id,
  fn,
  inputNames,
  outputName,
  defaultStyle,
}: codeFromFunctionParams): CodeNode => {
  return {
    id,
    inputs: inputNames.reduce((acc, k) => ({ ...acc, [k]: nodeInput() }), {}),
    outputs: { [outputName]: nodeOutput() },
    run: (inputs, outputs) => {
      const args = inputNames.map((name) => inputs[name]);
      const output = outputs[outputName];
      const result = fn(...args);
      return Promise.resolve(result).then((val) => output?.next(val));
    },
    completionOutputs: [outputName],
    defaultStyle,
  };
};
