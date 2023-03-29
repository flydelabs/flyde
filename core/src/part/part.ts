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
import { isInlinePartInstance, PartInstance } from "./part-instance";
import { InputPin, InputPinMap, OutputPin, OutputPinMap, partInput, partOutput } from "./part-pins";

export type PartRepo = OMap<Part>;

export type PartDefRepo = OMap<PartDefinition>;

export type CustomPartRepo = OMap<CustomPart>;

export type PartState = Map<string, any>;

export type PartAdvancedContext = {
  execute: InnerExecuteFn;
  insId: string;
  ancestorsInsIds?: string;
  state: PartState;
  onCleanup: (cb: Function) => void;
  onError: (e: any) => void;
  context: Record<string, any>;
};

export type PartFn = (
  args: OMapF<any>,
  o: OMapF<Subject<any>>,
  adv: PartAdvancedContext
) => void | CancelFn | Promise<void | CancelFn>;

export type CustomPartViewFn = (
  instance: PartInstance,
  inputs: OMap<PartInstance[]>,
  outputs: OMap<PartInstance[]>,
  repo: PartDefRepo
) =>
  | {
      label: string;
      hiddenInputs?: string[];
      hiddenOutputs?: string[];
    }
  | false;

export type PartStyleSize = "small" | "regular" | "large";
export type PartTypeIcon = string | [string, string];

export interface PartStyle {
  icon?: PartTypeIcon;
  size?: PartStyleSize;
  color?: string | [string, string];
  cssOverride?: Record<string, string>;
}

/**
 * Extended by {@link VisualPart}, {@link CodePart} and {@link InlineValuePart}
 */
export interface BasePart {
  /**
   * Part's unique id. {@link VisualPart.instances }  refer use this to refer to the correct part
   */
  id: string;
  /**
   * Is displayed in the visual editor and used to search for parts.
   */
  description?: string;
  /**
   * A list of keywords that can be used to search for the part. Useful for parts that users might search using different words.
  */
  searchKeywords?: string[];
  /**
   * A pin on a part that receives data. Each part can have zero or more input pins.
   *
   * Example for the inputs of a mathematical multiplier part:
   * ```ts
   * {
   *  multiplicand: { description: "The number to be multiplied" },
   *  multiplier: { description: "The number with which we multiply" },
   * }
   * ```
   */
  inputs: Record<string, InputPin>;
  /**
   * A pin on a part that sends data. Each part can have zero or more output pins.
   * For example, a "Split array" part might have one input pin for an array and two output pins for the first and second halves of the array:
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
   * Instructs Flyde that the part is in "explicit completion" mode and describes which outputs trigger the part's completion. Receives a list of outputs that should trigger an explicit completion of the part when they emit a value. Any of the listed outputs will trigger a completion (i.e. completionOutput[0] `OR` completionOutput[1])
   * Leave empty for implicit completion. This should work best for 99% of the case.
   *
   * To declare that 2 different outputs must emit a value in order to trigger a completion, different outputs can be joined together with a `+` sign as following:
   * ``` ts
   * {
   * ...
   *  completionOutputs: ["data+headers", "error"] // this means either data AND headers, OR "error" will trigger an explicit completion.
   * ```
   *
   * See the [Parts lifecycle](/docs/lifecycle) for more info
   */
  completionOutputs?: string[];
  /**
   * @deprecated - TBD
   */
  reactiveInputs?: string[];
  /**
   * Supply a custom string template ([EJS](https://ejs.co/) format) to control how an instance of this part will be rendered in the visual editor.
   * The template has access to static values, making it possible to expose valuable information in the instance itself:
   * @example
   * A "Delay" part has 2 inputs: value and a time. In many cases, the `time` input will be provided statically.
   * It can be convenient to show the time input in the instance itself so it shows "Delay 500ms" instead of "Delay" (in the case 500 is the static value of `time`)
   *
   * ```
   * {
   *   ...,
   *   customViewCode: "<% if (inputs.time) { %> Delay <%- inputs.time %> ms <% } else { %> Delay <% } %>",
   * }
   * ```
   *
   */
  customViewCode?: string;
  /**
   * All instances of this part will inherit the default style if it is supplied.
   * See {@link PartStyle} for the full options supported
   */
  defaultStyle?: PartStyle;
}

export interface CodePart extends BasePart {
  /**
   * This function will run as soon as the part's inputs are satisfied.
   * It has access to the parts inputs values, and output pins. See {@link PartFn} for more information.
   *
   */
  fn: PartFn;
  customView?: CustomPartViewFn;
}

export enum InlineValuePartType {
  VALUE = "value",
  FUNCTION = "function",
}

/**
 * InlineValuePart is used by the editor to create inline values and function.
 * @deprecated will turn into a "Macro Part" as soon as that is developed
 */

export interface InlineValuePart extends BasePart {
  fnCode: string;
  dataBuilderSource?: string; // quick solution for "Data builder iteration"
  templateType?: InlineValuePartType;
}

/**
 * A visual part is what makes Flyde special. It represents a part created visually in the editor.
 * It consists of part instances and connections. Each part instance will either refer to an imported part (by id), or include the part "inline".
 * Each connection will represent a "wire" between 2 instances, or between an instance and a main input/output pin.
 * Connecting to a main input or output is the way that a visual parts' internal implementation can communicate with its external API.
 */

export interface VisualPart extends BasePart {
  /** a map holding the position for each main input. Used in the editor only. */
  inputsPosition: OMap<Pos>;
  /** a map holding the position for each main output. Used in the editor only. */
  outputsPosition: OMap<Pos>;
  /** the visual parts internal part instances, either referring to other parts by id or by value (inline) */
  instances: PartInstance[];
  /** each connection represents a "wire" between 2 different instances, or between an instance and a main input/output*/
  connections: ConnectionData[];
  /** TODO - either deprecate this or {@link BasePart.customViewCode} */
  customView?: CustomPartViewFn;
}

export type Part = CodePart | CustomPart;

export type ImportablePart = { module: string; part: BasePart, implicit?: boolean };

export type CustomPart = VisualPart | InlineValuePart;

export type CodePartDefinition = Omit<CodePart, "fn">;

export type PartDefinition = CustomPart | CodePartDefinition;

export type PartModuleMetaData = {
  imported?: boolean;
};

export type PartDefinitionWithModuleMetaData = PartDefinition &
  PartModuleMetaData;

export const isBasePart = (p: any): p is BasePart => {
  return p && p.id && p.inputs && p.outputs;
}

export const isCodePart = (p: Part | PartDefinition): p is CodePart => {
  return isBasePart(p) && typeof (p as CodePart).fn === "function"
};

export const isVisualPart = (p: Part | PartDefinition): p is VisualPart => {
  return !!(p as VisualPart).instances;
};

export const isInlineValuePart = (
  p: Part | PartDefinition | undefined
): p is InlineValuePart => {
  return isDefined(p) && isDefined((p as InlineValuePart).fnCode);
};

export const visualPart = testDataCreator<VisualPart>({
  id: "visual-part",
  inputs: {},
  outputs: {},
  instances: [],
  connections: [],
  outputsPosition: {},
  inputsPosition: {},
});

export const codePart = testDataCreator<CodePart>({
  id: "part",
  inputs: {},
  outputs: {},
  fn: noop as any,
});

export const inlineValuePart = testDataCreator<InlineValuePart>({
  id: "part",
  inputs: {},
  outputs: {},
  fnCode: "",
});

export type SimplifiedPartParams = {
  id: string;
  inputTypes: OMap<string>;
  outputTypes: OMap<string>;
  fn: PartFn;
};

export const fromSimplified = ({
  fn,
  inputTypes,
  outputTypes,
  id,
}: SimplifiedPartParams): CodePart => {
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
    fn,
  };
};

export const maybeGetStaticValuePartId = (value: string) => {
  const maybePartMatch =
    typeof value === "string" && value.match(/^__part\:(.*)/);
  if (maybePartMatch) {
    const partId = maybePartMatch[1];
    return partId;
  }
  return null;
};
export const getStaticValue = (
  value: any,
  repo: PartDefRepo,
  calleeId: string
) => {
  const maybePartId = maybeGetStaticValuePartId(value);
  if (maybePartId) {
    const part = repo[maybePartId];
    if (!part) {
      throw new Error(
        `Instance ${calleeId} referrer to a part reference ${maybePartId} that does not exist`
      );
    }
    return part;
  } else {
    return value;
  }
};

export const getPart = (
  idOrIns: string | PartInstance,
  repo: PartRepo
): Part => {
  if (typeof idOrIns !== "string" && isInlinePartInstance(idOrIns)) {
    return idOrIns.part;
  }
  const id = typeof idOrIns === "string" ? idOrIns : idOrIns.partId;
  const part = repo[id];
  if (!part) {
    throw new Error(`Part with id ${id} not found`);
  }
  return part;
};

export const getPartDef = (
  idOrIns: string | PartInstance,
  repo: PartDefRepo
): PartDefinition => {
  if (typeof idOrIns !== "string" && isInlinePartInstance(idOrIns)) {
    return idOrIns.part;
  }
  const id = typeof idOrIns === "string" ? idOrIns : idOrIns.partId;
  const part = repo[id];
  if (!part) {
    console.error(`Part with id ${id} not found`);
    throw new Error(`Part with id ${id} not found`);
  }
  return part;
};

export type codeFromFunctionParams = {
  id: string;
  fn: Function;
  inputNames: string[];
  outputName: string;
  defaultStyle?: PartStyle;
};

export const codeFromFunction = ({
  id,
  fn,
  inputNames,
  outputName,
  defaultStyle,
}: codeFromFunctionParams): CodePart => {
  return {
    id,
    inputs: inputNames.reduce((acc, k) => ({ ...acc, [k]: partInput() }), {}),
    outputs: { [outputName]: partOutput() },
    fn: (inputs, outputs) => {
      const args = inputNames.map((name) => inputs[name]);
      const output = outputs[outputName];
      const result = fn(...args);
      return Promise.resolve(result).then((val) => output?.next(val));
    },
    completionOutputs: [outputName],
    defaultStyle,
  };
};
