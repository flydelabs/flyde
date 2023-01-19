import { partFromSimpleFunction } from "./utils/partFromSimpleFunction";

const namespace = 'Dates';

export const Now = partFromSimpleFunction({
    id: 'Now',
    icon: 'fa-calendar',
    namespace,
    description: 'Returns the current date and time',
    output: {name: 'now', description: 'Current date and time'},
    fn: () => new Date()
});

export const NowString = partFromSimpleFunction({

    id: 'Now String',
    icon: 'fa-calendar',
    namespace,
    description: 'Returns the current date and time as a string',
    output: {name: 'now', description: 'Current date and time'},
    fn: () => new Date().toString()
});

export const NowISOString = partFromSimpleFunction({
    id: 'Now ISO String',
    icon: 'fa-calendar',
    namespace,
    description: 'Returns the current date and time as a string in ISO format',
    output: {name: 'now', description: 'Current date and time'},
    fn: () => new Date().toISOString()
});

export const NowUnixTime = partFromSimpleFunction({
    id: 'Now Unix Time',
    icon: 'fa-calendar',
    namespace,
    description: 'Returns the current date and time as a Unix time',
    output: {name: 'now', description: 'Current date and time'},
    fn: () => new Date().getTime()
});

export const DateFromUnixTime = partFromSimpleFunction({

    id: 'Date From Unix Time',
    icon: 'fa-calendar',
    namespace,
    description: 'Creates a date from a Unix time',
    inputs: [{name: 'time', description: 'Unix time'}],
    output: {name: 'date', description: 'Date'},
    fn: (time) => new Date(time)

});

export const DateFromString = partFromSimpleFunction({

    id: 'Date From String',
    icon: 'fa-calendar',
    namespace,
    description: 'Creates a date from a string',
    inputs: [{name: 'string', description: 'String'}],
    output: {name: 'date', description: 'Date'},
    fn: (string) => new Date(string)

});

export const DateFromISOString = partFromSimpleFunction({
    id: 'Date From ISO String',
    icon: 'fa-calendar',
    namespace,
    description: 'Creates a date from an ISO string',
    inputs: [{name: 'string', description: 'String'}],
    output: {name: 'date', description: 'Date'},
    fn: (string) => new Date(string)
});

export const DateToString = partFromSimpleFunction({
    id: 'Date To String',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to a string',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'string', description: 'String'},
    fn: (date) => date.toString()
});

export const DateToISOString = partFromSimpleFunction({
    id: 'Date To ISO String',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to an ISO string',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'string', description: 'String'},
    fn: (date) => date.toISOString()
});

export const DateToUnixTime = partFromSimpleFunction({
    id: 'Date To Unix Time',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to a Unix time',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'time', description: 'Unix time'},
    fn: (date) => date.getTime()
});

export const DateToYear = partFromSimpleFunction({
    id: 'Date To Year',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to a year',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'year', description: 'Year'},
    fn: (date) => date.getFullYear()
});

export const DateToMonth = partFromSimpleFunction({
    id: 'Date To Month',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to a month',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'month', description: 'Month'},
    fn: (date) => date.getMonth()
});

export const DateToDay = partFromSimpleFunction({
    id: 'Date To Day',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to a day',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'day', description: 'Day'},
    fn: (date) => date.getDate()
});

export const DateToHours = partFromSimpleFunction({
    id: 'Date To Hours',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to hours',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'hours', description: 'Hours'},
    fn: (date) => date.getHours()
});

export const DateToMinutes = partFromSimpleFunction({
    id: 'Date To Minutes',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to minutes',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'minutes', description: 'Minutes'},
    fn: (date) => date.getMinutes()
});

export const DateToSeconds = partFromSimpleFunction({
    id: 'Date To Seconds',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to seconds',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'seconds', description: 'Seconds'},
    fn: (date) => date.getSeconds()
});

export const DateToMilliseconds = partFromSimpleFunction({
    id: 'Date To Milliseconds',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to milliseconds',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'milliseconds', description: 'Milliseconds'},
    fn: (date) => date.getMilliseconds()
});

export const DateToDayOfWeek = partFromSimpleFunction({
    id: 'Date To Day Of Week',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to a day of the week',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'day', description: 'Day'},
    fn: (date) => date.getDay()
});

export const DateToTimezoneOffset = partFromSimpleFunction({
    id: 'Date To Timezone Offset',
    icon: 'fa-calendar',
    namespace,
    description: 'Converts a date to a timezone offset',
    inputs: [{name: 'date', description: 'Date'}],
    output: {name: 'offset', description: 'Offset'},
    fn: (date) => date.getTimezoneOffset()
});

