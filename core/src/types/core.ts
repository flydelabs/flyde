import { InputPin, OutputPin } from "./pins";

export type NodeTypeIcon = string | [string, string];

export interface NodeStyle {
  icon?: NodeTypeIcon;
  color?: string | [string, string];
  cssOverride?: Record<string, string>;
}

export interface NodeMetadata {
  /**
   * Node's unique id. {@link VisualNode.instances }  refer use this to refer to the correct node
   */
  id: string;

  /**
   * A human readable name for the node. Used in the visual editor.
   */
  displayName?: string;

  menuDisplayName?: string;
  /**
   * Is displayed in the visual editor and used to search for nodes.
   */
  description?: string;
  /**
   * A list of keywords that can be used to search for the node. Useful for node that users might search using different words.
   */
  aliases?: string[];
  /**
   * TBD
   */
  namespace?: string;

  icon?: string;

  /**
   * All instances of this node will inherit the default style if it is supplied.
   * See {@link NodeStyle} for the full options supported
   */
  defaultStyle?: NodeStyle;

  /**
   * Hack to support note node without adding first class support for it.
   * This is used to override the node body html for a node.
   */
  overrideNodeBodyHtml?: string;
}

/**
 * Extended by {@link VisualNode}, {@link InternalCodeNode} and {@link InlineValueNode}
 */
export interface BaseNode extends NodeMetadata {
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
}
