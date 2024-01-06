import { CodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Add: CodeNode = {
  id: "Add",
  defaultStyle: {
    icon: "fa-plus",
  },
  namespace,
  description: "Emits the sum of two numbers",
  inputs: {
    n1: { description: "First number to add" },
    n2: { description: "Second number to add" },
  },
  outputs: { sum: { description: "The sum of n1 and n2" } },
  run: ({ n1, n2 }, { sum }) => sum.next(n1 + n2),
};

export const Subtract: CodeNode = {
  id: "Subtract",
  defaultStyle: {
    icon: "fa-minus",
  },
  namespace,
  description: "Emits the difference of two numbers",
  inputs: {
    n1: { description: "First number to subtract" },
    n2: { description: "Second number to subtract" },
  },
  outputs: { difference: { description: "The difference of n1 and n2" } },
  run: ({ n1, n2 }, { difference }) => difference.next(n1 - n2),
};

export const Multiply: CodeNode = {
  id: "Multiply",
  defaultStyle: {
    icon: "fa-times",
  },
  namespace,
  description: "Emits the product of two numbers",
  inputs: {
    n1: { description: "First number to multiply" },
    n2: { description: "Second number to multiply" },
  },
  outputs: { product: { description: "The product of n1 and n2" } },
  run: ({ n1, n2 }, { product }) => product.next(n1 * n2),
};

export const Divide: CodeNode = {
  id: "Divide",
  defaultStyle: {
    icon: "fa-divide",
  },
  namespace,
  description: "Emits the quotient of two numbers",
  inputs: {
    n1: { description: "First number to divide" },
    n2: { description: "Second number to divide" },
  },
  outputs: { quotient: { description: "The quotient of n1 and n2" } },
  run: ({ n1, n2 }, { quotient }) => quotient.next(n1 / n2),
};

export const Modulo: CodeNode = {
  id: "Modulo",
  defaultStyle: {
    icon: "fa-percentage",
  },
  namespace,
  description: "Emits the remainder of two numbers",
  inputs: {
    n1: { description: "First number to divide" },
    n2: { description: "Second number to divide" },
  },
  outputs: { remainder: { description: "The remainder of n1 and n2" } },
  run: ({ n1, n2 }, { remainder }) => remainder.next(n1 % n2),
};

export const Power: CodeNode = {
  id: "Power",
  defaultStyle: {
    icon: "fa-superscript",
  },
  namespace,
  description: "Emits the power of two numbers",
  inputs: {
    n1: { description: "Base number" },
    n2: { description: "Exponent" },
  },
  outputs: { power: { description: "The power of n1 and n2" } },
  run: ({ n1, n2 }, { power }) => power.next(Math.pow(n1, n2)),
};

export const SquareRoot: CodeNode = {
  id: "Square Root",
  defaultStyle: {
    icon: "fa-square-root-alt",
  },
  namespace,
  description: "Emits the square root of a number",
  inputs: { n: { description: "Number to take the square root of" } },
  outputs: { root: { description: "The square root of n" } },
  run: ({ n }, { root }) => root.next(Math.sqrt(n)),
};

export const AbsoluteValue: CodeNode = {
  id: "Absolute Value",
  defaultStyle: {
    icon: "fa-abs",
  },
  namespace,
  description: "Emits the absolute value of a number",
  inputs: { n: { description: "Number to take the absolute value of" } },
  outputs: { absolute: { description: "The absolute value of n" } },
  run: ({ n }, { absolute }) => absolute.next(Math.abs(n)),
};

export const Floor: CodeNode = {
  id: "Floor",
  defaultStyle: {
    icon: "fa-floor",
  },
  namespace,
  description: "Emits the floor of a number",
  inputs: { n: { description: "Number to take the floor of" } },
  outputs: { floor: { description: "The floor of n" } },
  run: ({ n }, { floor }) => floor.next(Math.floor(n)),
};

export const Ceiling: CodeNode = {
  id: "Ceiling",
  defaultStyle: {
    icon: "fa-ceiling",
  },
  namespace,
  description: "Emits the ceiling of a number",
  inputs: { n: { description: "Number to take the ceiling of" } },
  outputs: { ceiling: { description: "The ceiling of n" } },
  run: ({ n }, { ceiling }) => ceiling.next(Math.ceil(n)),
};

export const Round: CodeNode = {
  id: "Round",
  defaultStyle: {
    icon: "fa-round",
  },
  namespace,
  description: "Emits the rounded value of a number",
  inputs: { n: { description: "Number to round" } },
  outputs: { rounded: { description: "The rounded value of n" } },
  run: ({ n }, { rounded }) => rounded.next(Math.round(n)),
};

export const Truncate: CodeNode = {
  id: "Truncate",
  defaultStyle: {
    icon: "fa-truncate",
  },
  namespace,
  description: "Emits the truncated value of a number",
  inputs: { n: { description: "Number to truncate" } },
  outputs: { truncated: { description: "The truncated value of n" } },
  run: ({ n }, { truncated }) => truncated.next(Math.trunc(n)),
};

export const Sin: CodeNode = {
  id: "Sin",
  defaultStyle: {
    icon: "fa-sin",
  },
  namespace,
  description: "Emits the sine of an angle",
  inputs: { angle: { description: "Angle in radians" } },
  outputs: { sine: { description: "The sine of angle" } },
  run: ({ angle }, { sine }) => sine.next(Math.sin(angle)),
};

export const Cos: CodeNode = {
  id: "Cos",
  defaultStyle: {
    icon: "fa-cos",
  },
  namespace,
  description: "Emits the cosine of an angle",
  inputs: { angle: { description: "Angle in radians" } },
  outputs: { cosine: { description: "The cosine of angle" } },
  run: ({ angle }, { cosine }) => cosine.next(Math.cos(angle)),
};

export const Min: CodeNode = {
  id: "Min",
  namespace,
  description: "Emits the minimum of two numbers",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: { min: { description: "The minimum of n1 and n2" } },
  run: ({ n1, n2 }, { min }) => min.next(Math.min(n1, n2)),
};

export const Max: CodeNode = {
  id: "Max",
  namespace,
  description: "Emits the maximum of two numbers",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: { max: { description: "The maximum of n1 and n2" } },
  run: ({ n1, n2 }, { max }) => max.next(Math.max(n1, n2)),
};

export const ParseInt: CodeNode = {
  id: "Parse Int",
  namespace,
  description: "Emits the integer value of a string",
  inputs: { str: { description: "String to parse" } },
  outputs: { int: { description: "The integer value of str" } },
  run: ({ str }, { int }) => int.next(parseInt(str)),
};

export const ParseFloat: CodeNode = {
  id: "Parse Float",
  namespace,
  description: "Emits the float value of a string",
  inputs: { str: { description: "String to parse" } },
  outputs: { float: { description: "The float value of str" } },
  run: ({ str }, { float }) => float.next(parseFloat(str)),
};

export const ToFixed: CodeNode = {
  id: "To Fixed",
  namespace,
  description: "Emits the specified number of decimal places of a number",
  inputs: {
    number: { description: "Number to format" },
    places: { description: "Number of decimal places to format to" },
  },
  outputs: {
    fixed: {
      description: "The number with the specified number of decimal places",
    },
  },
  run: ({ number, places }, { fixed }) => fixed.next(number.toFixed(places)),
};

export const GreaterThan: CodeNode = {
  id: "Greater Than",
  namespace,
  description: "Emits true if the first number is greater than the second",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: { result: { description: "true if n1 is greater than n2" } },
  run: ({ n1, n2 }, { result }) => result.next(n1 > n2),
};

export const GreaterThanOrEqual: CodeNode = {
  id: "Greater Than Or Equal",
  namespace,
  description:
    "Emits true if the first number is greater than or equal to the second",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: {
    result: { description: "true if n1 is greater than or equal to n2" },
  },
  run: ({ n1, n2 }, { result }) => result.next(n1 >= n2),
};

export const LessThan: CodeNode = {
  id: "Less Than",
  namespace,
  description: "Emits true if the first number is less than the second",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: { result: { description: "true if n1 is less than n2" } },
  run: ({ n1, n2 }, { result }) => result.next(n1 < n2),
};

export const LessThanOrEqual: CodeNode = {
  id: "Less Than Or Equal",
  namespace,
  description:
    "Emits true if the first number is less than or equal to the second",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: {
    result: { description: "true if n1 is less than or equal to n2" },
  },
  run: ({ n1, n2 }, { result }) => result.next(n1 <= n2),
};

export const SumList: CodeNode = {
  id: "Sum List",
  defaultStyle: {
    icon: "fa-plus",
  },
  namespace,
  description: "Emits the sum of a list of numbers",
  inputs: { list: { description: "List of numbers" } },
  outputs: { sum: { description: "The sum of the numbers in list" } },
  run: ({ list }, { sum }) => sum.next(list.reduce((a, b) => a + b, 0)),
};
