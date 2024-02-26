import { MacroNode } from "@flyde/core";

export enum ConditionType {
  Equal = "EQUAL",
  NotEqual = "NOT_EQUAL",
  GreaterThan = "GREATER_THAN",
  GreaterThanOrEqual = "GREATER_THAN_OR_EQUAL",
  LessThan = "LESS_THAN",
  LessThanOrEqual = "LESS_THAN_OR_EQUAL",
  Contains = "CONTAINS",
  NotContains = "NOT_CONTAINS",
  RegexMatches = "REGEX_MATCHES",
  IsEmpty = "IS_EMPTY",
  IsNotEmpty = "IS_NOT_EMPTY",
  IsNull = "IS_NULL",
  IsNotNull = "IS_NOT_NULL",
  IsUndefined = "IS_UNDEFINED",
  IsNotUndefined = "IS_NOT_UNDEFINED",
  HasProperty = "HAS_PROPERTY",
  LengthEqual = "LENGTH_EQUAL",
  LengthNotEqual = "LENGTH_NOT_EQUAL",
  LengthGreaterThan = "LENGTH_GREATER_THAN",
  LengthLessThan = "LENGTH_LESS_THAN",
  TypeEquals = "TYPE_EQUALS",
  Expression = "EXPRESSION",
}

export interface ConditionalConfig {
  propertyPath: string;
  condition: { type: ConditionType; data?: string };
  compareTo:
    | { mode: "static"; value: any; type: "number" | "string" | "json" }
    | { mode: "dynamic"; propertyPath: string };
  trueValue:
    | { type: "value" | "compareTo" }
    | { type: "expression"; data: string };
  falseValue:
    | { type: "value" | "compareTo" }
    | { type: "expression"; data: string };
}

function conditionalConfigToDisplayName(config: ConditionalConfig) {
  const { type } = config.condition;

  const compareTo =
    config.compareTo.mode === "static"
      ? JSON.stringify(config.compareTo.value)
      : "`compareTo`";
  switch (type) {
    case ConditionType.Equal:
      return `Equals ${compareTo}`;
    case ConditionType.NotEqual:
      return `Does not equal ${compareTo}`;
    case ConditionType.GreaterThan:
      return `Greater than ${compareTo}`;
    case ConditionType.GreaterThanOrEqual:
      return `Greater than or equal to ${compareTo}`;
    case ConditionType.LessThan:
      return `Less than ${compareTo}`;
    case ConditionType.LessThanOrEqual:
      return `Less than or equal to ${compareTo}`;
    case ConditionType.Contains:
      return `Contains ${compareTo}`;
    case ConditionType.NotContains:
      return `Does not contain ${compareTo}`;
    case ConditionType.RegexMatches:
      return `Matches regex ${compareTo}`;
    case ConditionType.IsEmpty:
      return `Is empty`;
    case ConditionType.IsNotEmpty:
      return `Is not empty`;
    case ConditionType.IsNull:
      return `Is null`;
    case ConditionType.IsNotNull:
      return `Is not null`;
    case ConditionType.IsUndefined:
      return `Is undefined`;
    case ConditionType.IsNotUndefined:
      return `Is not undefined`;
    case ConditionType.HasProperty:
      return `Has property ${compareTo}`;
    case ConditionType.LengthEqual:
      return `Length equals ${compareTo}`;
    case ConditionType.LengthNotEqual:
      return `Length does not equal ${compareTo}`;
    case ConditionType.LengthGreaterThan:
      return `Length greater than ${compareTo}`;
    case ConditionType.LengthLessThan:
      return `Length less than ${compareTo}`;
    case ConditionType.TypeEquals:
      return `Type equals ${compareTo}`;
    case ConditionType.Expression:
      return config.condition.data;
  }
}

export const Conditional: MacroNode<ConditionalConfig> = {
  id: "Conditional",
  namespace: "Control Flow",
  description: "Evaluates a condition and emits the value of the matching case",
  defaultStyle: {
    icon: "circle-question",
  },
  runFnBuilder: (config) => {
    return (inputs, outputs, adv) => {
      const {
        compareTo: argType,
        propertyPath,
        condition,
        trueValue,
        falseValue,
      } = config;
      const { true: trueOutput, false: falseOutput } = outputs;

      const comparedValue =
        argType.mode === "static" ? argType.value : inputs.compareTo;

      const leftSide = propertyPath
        ? getProperty(inputs.value, propertyPath)
        : inputs.value;
      const rightSide =
        config.compareTo.mode === "dynamic" && config.compareTo.propertyPath
          ? getProperty(comparedValue, config.compareTo.propertyPath)
          : comparedValue;

      const result = calculateCondition(leftSide, rightSide, condition);

      const outputToUse = result ? trueOutput : falseOutput;
      const configToUse = result ? trueValue : falseValue;

      if (configToUse.type === "value") {
        outputToUse.next(inputs.value);
      } else if (configToUse.type === "compareTo") {
        outputToUse.next(comparedValue);
      } else if (configToUse.type === "expression") {
        const expression = configToUse.data;
        try {
          const fnStr = `(value, compareTo) => ${expression}`;
          const fn = eval(fnStr);
          outputToUse.next(fn(inputs.value, comparedValue));
        } catch (e) {
          adv.onError(e);
        }
      } else {
        throw new Error(`Unknown type ${configToUse.type}`);
      }
    };
  },
  definitionBuilder: (config) => {
    const inputs = ["value"];

    if (config.compareTo.mode === "dynamic") {
      inputs.push("compareTo");
    }

    const outputs = {
      true: {
        description: "Emits the value if the condition is true",
      },
      false: {
        description: "Emits the value if the condition is false",
      },
    };

    return {
      displayName: conditionalConfigToDisplayName(config),
      description:
        "Evaluates a condition and emits the value of the matching case",
      inputs: Object.fromEntries(inputs.map((input) => [input, {}])),
      outputs,
    };
  },
  defaultData: {
    compareTo: { mode: "dynamic", propertyPath: "" },
    propertyPath: "",
    condition: {
      type: ConditionType.Equal,
    },
    trueValue: {
      type: "value",
    },
    falseValue: {
      type: "value",
    },
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../../dist/ui/Conditional.js",
  },
};

function calculateCondition(
  val1: any,
  val2: any,
  condition: ConditionalConfig["condition"]
) {
  switch (condition.type) {
    case ConditionType.Equal:
      return val1 === val2;
    case ConditionType.NotEqual:
      return val1 !== val2;
    case ConditionType.GreaterThan:
      return val1 > val2;
    case ConditionType.GreaterThanOrEqual:
      return val1 >= val2;
    case ConditionType.LessThan:
      return val1 < val2;
    case ConditionType.LessThanOrEqual:
      return val1 <= val2;
    case ConditionType.Contains:
      return val1.includes(val2);
    case ConditionType.NotContains:
      return !val1.includes(val2);
    case ConditionType.IsEmpty:
      return val1 === "";
    case ConditionType.IsNotEmpty:
      return val1 !== "";
    case ConditionType.IsNull:
      return val1 === null;
    case ConditionType.IsNotNull:
      return val1 !== null;
    case ConditionType.IsUndefined:
      return typeof val1 === "undefined";
    case ConditionType.IsNotUndefined:
      return typeof val1 !== "undefined";
    case ConditionType.HasProperty:
      return val1.hasOwnProperty(val2);
    case ConditionType.LengthEqual:
      return val1.length === val2;
    case ConditionType.LengthNotEqual:
      return val1.length !== val2;
    case ConditionType.LengthGreaterThan:
      return val1.length > val2;
    case ConditionType.LengthLessThan:
      return val1.length < val2;
    case ConditionType.TypeEquals:
      return typeof val1 === val2;
    case ConditionType.RegexMatches: {
      return new RegExp(val1).test(val2);
    }
    case ConditionType.Expression: {
      try {
        const fnStr = `(value, compareTo) => ${condition.data}`;
        const fn = eval(fnStr);
        return fn(val1, val2);
      } catch (e) {
        console.error(e);
        return false;
      }
    }
  }
}

function getProperty(obj: any, path: string) {
  const parts = path.split(".").filter((p) => p !== "");
  let curr = obj;
  for (const part of parts) {
    if (part) {
    }
    curr = curr[part];
  }
  return curr;
}
