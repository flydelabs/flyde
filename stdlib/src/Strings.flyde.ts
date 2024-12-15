import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const Concat: CodeNode = {
  id: "Concat",
  defaultStyle: {
    icon: "fa-font",
  },
  namespace,
  description: "Concatenates two strings",
  inputs: {
    a: { description: "String a" },
    b: { description: "String b" },
  },
  outputs: { value: { description: "Concatenated value" } },
  run: ({ a, b }, { value }) => value.next(a + b),
};

export const Split: CodeNode = {
  id: "Split",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Splits a string",
  inputs: {
    string: { description: "String to split" },
    separator: { description: "Separator" },
  },
  outputs: { value: { description: "Splitted value" } },
  run: ({ string, separator }, { value }) =>
    value.next(string.split(separator)),
};

export const Join: CodeNode = {
  id: "Join",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Joins an array of strings",
  inputs: {
    array: { description: "Array to join" },
    separator: { description: "Separator" },
  },
  outputs: { value: { description: "Joined value" } },
  run: ({ array, separator }, { value }) => value.next(array.join(separator)),
};

export const Replace: CodeNode = {
  id: "Replace",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Replaces a string",
  inputs: {
    string: { description: "String to replace" },
    searchValue: { description: "Value to search for" },
    replaceValue: { description: "Value to replace with" },
  },
  outputs: { value: { description: "Replaced value" } },
  run: ({ string, searchValue, replaceValue }, { value }) =>
    value.next(string.replace(searchValue, replaceValue)),
};

export const Trim: CodeNode = {
  id: "Trim",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Trims a string",
  inputs: { string: { description: "String to trim" } },
  outputs: { value: { description: "Trimmed value" } },
  run: ({ string }, { value }) => value.next(string.trim()),
};

export const ToLowerCase: CodeNode = {
  id: "To Lower Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to lower case",
  inputs: { string: { description: "String to convert to lower case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) => value.next(string.toLowerCase()),
};

export const ToUpperCase: CodeNode = {
  id: "To Upper Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to upper case",
  inputs: { string: { description: "String to convert to upper case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) => value.next(string.toUpperCase()),
};

export const Substring: CodeNode = {
  id: "Substring",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description:
    "Returns the node of the string between the start and end indexes",
  inputs: {
    string: { description: "String to get substring from" },
    start: { description: "Start index" },
    end: { description: "End index" },
  },
  outputs: { value: { description: "Substring" } },
  run: ({ string, start, end }, { value }) =>
    value.next(string.substring(start, end)),
};

export const Length: CodeNode = {
  id: "Length",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Returns the length of a string",
  inputs: { string: { description: "String to get length from" } },
  outputs: { value: { description: "Length" } },
  run: ({ string }, { value }) => value.next(string.length),
};

export const IndexOf: CodeNode = {
  id: "Index Of",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description:
    "Returns the index within the calling String object of the first occurrence of the specified value, starting the search at fromIndex",
  inputs: {
    string: { description: "String to search in" },
    searchValue: { description: "Value to search for" },
    fromIndex: { description: "Index to start searching from" },
  },
  outputs: { value: { description: "Index" } },
  run: ({ string, searchValue, fromIndex }, { value }) =>
    value.next(string.indexOf(searchValue, fromIndex)),
};

export const LastIndexOf: CodeNode = {
  id: "Last Index Of",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description:
    "Returns the index within the calling String object of the last occurrence of the specified value, or -1 if not found. The calling string is searched backward, starting at fromIndex",
  inputs: {
    string: { description: "String to search in" },
    searchValue: { description: "Value to search for" },
    fromIndex: { description: "Index to start searching from" },
  },
  outputs: { value: { description: "Index" } },
  run: ({ string, searchValue, fromIndex }, { value }) =>
    value.next(string.lastIndexOf(searchValue, fromIndex)),
};

export const CharAt: CodeNode = {
  id: "Char At",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Returns the character at the specified index",
  inputs: {
    string: { description: "String to get character from" },
    index: { description: "Index to get character from" },
  },
  outputs: { value: { description: "Character" } },
  run: ({ string, index }, { value }) => value.next(string.charAt(index)),
};

export const ToKebabCase: CodeNode = {
  id: "To Kebab Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to kebab case",
  inputs: { string: { description: "String to convert to kebab case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) =>
    value.next(
      string
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/\s+/g, "-")
        .toLowerCase()
    ),
};

export const ToCamelCase: CodeNode = {
  id: "To Camel Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to camel case",
  inputs: { string: { description: "String to convert to camel case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) =>
    value.next(
      string.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (+match === 0) return "";
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      })
    ),
};

export const ToPascalCase: CodeNode = {
  id: "To Pascal Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to pascal case",
  inputs: { string: { description: "String to convert to pascal case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) =>
    value.next(
      string
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => {
          return index === 0 ? match.toUpperCase() : match.toLowerCase();
        })
        .replace(/\s+/g, "")
    ),
};

export const ToSnakeCase: CodeNode = {
  id: "To Snake Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to snake case",
  inputs: { string: { description: "String to convert to snake case" } },
  outputs: { value: { description: "Converted value" } },
  run: (string) =>
    string
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/\s+/g, "_")
      .toLowerCase(),
};

export const ToTitleCase: CodeNode = {
  id: "To Title Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to title case",
  inputs: { string: { description: "String to convert to title case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) =>
    value.next(
      string.replace(
        /\w\S*/g,
        (match) => match.charAt(0).toUpperCase() + match.substr(1).toLowerCase()
      )
    ),
};

export const Includes: CodeNode = {
  id: "Includes",
  namespace,
  defaultStyle: { icon: "fa-font" },
  description:
    "Determines whether one string may be found within another string, returning true or false as appropriate",
  inputs: {
    string: { description: "String to search in" },
    searchValue: { description: "Value to search for" },
    fromIndex: { description: "Index to start searching from" },
  },
  outputs: { value: { description: "Result" } },
  run: ({ string, searchValue, fromIndex }, { value }) =>
    value.next(string.includes(searchValue, fromIndex)),
};

export const StartsWith: CodeNode = {
  id: "Starts With",
  namespace,
  defaultStyle: { icon: "fa-font" },
  description:
    "Determines whether a string begins with the characters of another string, returning true or false as appropriate",
  inputs: {
    string: { description: "String to search in" },
    searchValue: { description: "Value to search for" },
    fromIndex: { description: "Index to start searching from" },
  },
  outputs: { value: { description: "Result" } },
  run: ({ string, searchValue, fromIndex }, { value }) =>
    value.next(string.startsWith(searchValue, fromIndex)),
};

export const EndsWith: CodeNode = {
  id: "Ends With",
  namespace,
  defaultStyle: { icon: "fa-font" },
  description:
    "Determines whether a string ends with the characters of another string, returning true or false as appropriate",
  inputs: {
    string: { description: "String to search in" },
    searchValue: { description: "Value to search for" },
    fromIndex: { description: "Index to start searching from" },
  },
  outputs: { value: { description: "Result" } },
  run: (string, searchValue, fromIndex) =>
    string.endsWith(searchValue, fromIndex),
};

export const IsEmpty: CodeNode = {
  id: "Is Empty",
  namespace,
  defaultStyle: { icon: "fa-font" },
  description: "Determines whether a string is empty",
  inputs: { string: { description: "String to check" } },
  outputs: { value: { description: "Result" } },
  run: ({ string }, { value }) => value.next(string.length === 0),
};

export const MatchRegex: CodeNode = {
  id: "Match Regex",
  namespace,
  defaultStyle: { icon: "fa-font" },
  description: "Determines whether a string matches a regular expression",
  inputs: {
    string: { description: "String to check" },
    regex: { description: "Regular expression to match" },
  },
  outputs: { value: { description: "Result" } },
  run: ({ string, regex }, { value }) => value.next(string.match(regex)),
};

export const EmptyString: CodeNode = {
  id: "Empty String",
  namespace,
  defaultStyle: { icon: "fa-font", size: "small" },
  description: "Creates an empty string",
  inputs: {},
  outputs: { string: { description: "The empty string" } },
  run: ({}, { string }) => string.next(""),
};
