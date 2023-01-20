import { partFromSimpleFunction } from "./utils/partFromSimpleFunction";

const namespace = 'Strings';

export const Concat = partFromSimpleFunction({
    id: 'Concat',
    icon: 'fa-font',
    namespace,
    description: 'Concatenates two strings',
    inputs: [
        {name: 'a', description: 'String a'},
        {name: 'b', description: 'String b'},
    ],
    output: {name: 'value', description: 'Concatenated value'},
    fn: (a, b) => a + b
});

export const Split = partFromSimpleFunction({
    id: 'Split',
    icon: 'fa-font',
    namespace,
    description: 'Splits a string',
    inputs: [
        {name: 'string', description: 'String to split'},
        {name: 'separator', description: 'Separator'},
    ],
    output: {name: 'value', description: 'Splitted value'},
    fn: (string, separator) => string.split(separator)
});

export const Join = partFromSimpleFunction({
    id: 'Join',
    icon: 'fa-font',
    namespace,
    description: 'Joins an array of strings',
    inputs: [
        {name: 'array', description: 'Array to join'},
        {name: 'separator', description: 'Separator'},
    ],
    output: {name: 'value', description: 'Joined value'},
    fn: (array, separator) => array.join(separator)
}); 

export const Replace = partFromSimpleFunction({
    id: 'Replace',
    icon: 'fa-font',
    namespace,
    description: 'Replaces a string',
    inputs: [
        {name: 'string', description: 'String to replace'},
        {name: 'searchValue', description: 'Value to search for'},
        {name: 'replaceValue', description: 'Value to replace with'},
    ],
    output: {name: 'value', description: 'Replaced value'},
    fn: (string, searchValue, replaceValue) => string.replace(searchValue, replaceValue)
});

export const Trim = partFromSimpleFunction({
    id: 'Trim',
    icon: 'fa-font',
    namespace,
    description: 'Trims a string',
    inputs: [
        {name: 'string', description: 'String to trim'},
    ],
    output: {name: 'value', description: 'Trimmed value'},
    fn: (string) => string.trim()
});

export const ToLowerCase = partFromSimpleFunction({
    id: 'To Lower Case',
    icon: 'fa-font',
    namespace,
    description: 'Converts a string to lower case',
    inputs: [
        {name: 'string', description: 'String to convert to lower case'},
    ],
    output: {name: 'value', description: 'Converted value'},
    fn: (string) => string.toLowerCase()
});

export const ToUpperCase = partFromSimpleFunction({
    id: 'To Upper Case',
    icon: 'fa-font',
    namespace,
    description: 'Converts a string to upper case',
    inputs: [
        {name: 'string', description: 'String to convert to upper case'},
    ],
    output: {name: 'value', description: 'Converted value'},
    fn: (string) => string.toUpperCase()
});

export const Substring = partFromSimpleFunction({
    id: 'Substring',
    icon: 'fa-font',
    namespace,
    description: 'Returns the part of the string between the start and end indexes',
    inputs: [
        {name: 'string', description: 'String to get substring from'},
        {name: 'start', description: 'Start index'},
        {name: 'end', description: 'End index'},
    ],
    output: {name: 'value', description: 'Substring'},
    fn: (string, start, end) => string.substring(start, end)
});

export const Length = partFromSimpleFunction({
    id: 'Length',
    icon: 'fa-font',
    namespace,
    description: 'Returns the length of a string',
    inputs: [
        {name: 'string', description: 'String to get length from'},
    ],
    output: {name: 'value', description: 'Length'},
    fn: (string) => string.length
});

export const IndexOf = partFromSimpleFunction({
    id: 'Index Of',
    icon: 'fa-font',
    namespace,
    description: 'Returns the index within the calling String object of the first occurrence of the specified value, starting the search at fromIndex',
    inputs: [
        {name: 'string', description: 'String to search in'},
        {name: 'searchValue', description: 'Value to search for'},
        {name: 'fromIndex', description: 'Index to start searching from'},
    ],
    output: {name: 'value', description: 'Index'},
    fn: (string, searchValue, fromIndex) => string.indexOf(searchValue, fromIndex)
});

export const LastIndexOf = partFromSimpleFunction({
    id: 'Last Index Of',
    icon: 'fa-font',
    namespace,
    description: 'Returns the index within the calling String object of the last occurrence of the specified value, or -1 if not found. The calling string is searched backward, starting at fromIndex',
    inputs: [
        {name: 'string', description: 'String to search in'},
        {name: 'searchValue', description: 'Value to search for'},
        {name: 'fromIndex', description: 'Index to start searching from'},
    ],
    output: {name: 'value', description: 'Index'},
    fn: (string, searchValue, fromIndex) => string.lastIndexOf(searchValue, fromIndex)
});

export const CharAt = partFromSimpleFunction({
    id: 'Char At',
    icon: 'fa-font',
    namespace,
    description: 'Returns the character at the specified index',
    inputs: [
        {name: 'string', description: 'String to get character from'},
        {name: 'index', description: 'Index to get character from'},
    ],
    output: {name: 'value', description: 'Character'},
    fn: (string, index) => string.charAt(index)
});

export const ToKebabCase = partFromSimpleFunction({
    id: 'To Kebab Case',
    icon: 'fa-font',
    namespace,
    description: 'Converts a string to kebab case',
    inputs: [
        {name: 'string', description: 'String to convert to kebab case'},
    ],
    output: {name: 'value', description: 'Converted value'},
    fn: (string) => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase()
});

export const ToCamelCase = partFromSimpleFunction({
    id: 'To Camel Case',
    icon: 'fa-font',
    namespace,
    description: 'Converts a string to camel case',
    inputs: [
        {name: 'string', description: 'String to convert to camel case'},
    ],
    output: {name: 'value', description: 'Converted value'},
    fn: (string) => string.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (+match === 0) return '';
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    })
});

export const ToPascalCase = partFromSimpleFunction({
    id: 'To Pascal Case',
    icon: 'fa-font',
    namespace,
    description: 'Converts a string to pascal case',
    inputs: [
        {name: 'string', description: 'String to convert to pascal case'},
    ],
    output: {name: 'value', description: 'Converted value'},
    fn: (string) => string.replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => {
        return index === 0 ? match.toUpperCase() : match.toLowerCase();
    }).replace(/\s+/g, '')
});

export const ToSnakeCase = partFromSimpleFunction({
    id: 'To Snake Case',
    icon: 'fa-font',
    namespace,
    description: 'Converts a string to snake case',
    inputs: [
        {name: 'string', description: 'String to convert to snake case'},
    ],
    output: {name: 'value', description: 'Converted value'},
    fn: (string) => string.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/\s+/g, '_').toLowerCase()
});

export const ToTitleCase = partFromSimpleFunction({
    id: 'To Title Case',
    icon: 'fa-font',
    namespace,
    description: 'Converts a string to title case',
    inputs: [
        {name: 'string', description: 'String to convert to title case'},
    ],
    output: {name: 'value', description: 'Converted value'},
    fn: (string) => string.replace(/\w\S*/g, (match) => match.charAt(0).toUpperCase() + match.substr(1).toLowerCase())
});

export const Includes = partFromSimpleFunction({
    id: 'Includes',
    namespace,
    icon: 'fa-font',
    description: 'Determines whether one string may be found within another string, returning true or false as appropriate',
    inputs: [
        {name: 'string', description: 'String to search in'},
        {name: 'searchValue', description: 'Value to search for'},
        {name: 'fromIndex', description: 'Index to start searching from'},
    ],
    output: {name: 'value', description: 'Result'},
    fn: (string, searchValue, fromIndex) => string.includes(searchValue, fromIndex)
});

export const StartsWith = partFromSimpleFunction({
    id: 'Starts With',
    namespace,
    icon: 'fa-font',
    description: 'Determines whether a string begins with the characters of another string, returning true or false as appropriate',
    inputs: [
        {name: 'string', description: 'String to search in'},
        {name: 'searchValue', description: 'Value to search for'},
        {name: 'fromIndex', description: 'Index to start searching from'},
    ],
    output: {name: 'value', description: 'Result'},
    fn: (string, searchValue, fromIndex) => string.startsWith(searchValue, fromIndex)
});

export const EndsWith = partFromSimpleFunction({
    id: 'Ends With',
    namespace,
    icon: 'fa-font',
    description: 'Determines whether a string ends with the characters of another string, returning true or false as appropriate',
    inputs: [
        {name: 'string', description: 'String to search in'},
        {name: 'searchValue', description: 'Value to search for'},
        {name: 'fromIndex', description: 'Index to start searching from'},
    ],
    output: {name: 'value', description: 'Result'},
    fn: (string, searchValue, fromIndex) => string.endsWith(searchValue, fromIndex)
});

export const IsEmpty = partFromSimpleFunction({
    id: 'Is Empty',
    namespace,
    icon: 'fa-font',
    description: 'Determines whether a string is empty',
    inputs: [
        {name: 'string', description: 'String to check'},
    ],
    output: {name: 'value', description: 'Result'},
    fn: (string) => string.length === 0
});

export const MatchRegex = partFromSimpleFunction({
    id: 'Match Regex',
    namespace,
    icon: 'fa-font',
    description: 'Determines whether a string matches a regular expression',
    inputs: [
        {name: 'string', description: 'String to check'},
        {name: 'regex', description: 'Regular expression to match'},
    ],
    output: {name: 'value', description: 'Result'},
    fn: (string, regex) => string.match(regex)
});
