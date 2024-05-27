import { CodeNode } from "@flyde/core";
export const CountCharacters: CodeNode = {
  id: "CountCharacters",
  displayName: "Count Characters",
  description: "Emits the number of white space and non-white space characters in the input string",
  inputs: {
    str: { description: "The input string to analyze" },
  },
  outputs: {
    whiteSpaces: { description: "The count of white space characters" },
    nonWhiteSpaces: { description: "The count of non-white space characters" },
  },
  run: ({ str }, { whiteSpaces, nonWhiteSpaces }) => {
    const whiteSpaceCount = (str.match(/\s/g) || []).length;
    const nonWhiteSpaceCount = str.length - whiteSpaceCount;
    whiteSpaces.next(whiteSpaceCount);
    nonWhiteSpaces.next(nonWhiteSpaceCount);
  },
};