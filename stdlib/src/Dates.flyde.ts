import { CodePart, partFromSimpleFunction } from "@flyde/core";

const namespace = "Dates";

export const Now: CodePart = {
  id: "Now",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Returns the current date and time",
  inputs: {},
  outputs: { now: { description: "Current date and time" } },
  run: (_, { now }) => now.next(new Date()),
};

export const NowString: CodePart = {
  id: "Now String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Returns the current date and time as a string",
  inputs: {},
  outputs: { now: { description: "Current date and time" } },
  run: (_, { now }) => now.next(new Date().toString()),
};

export const NowISOString: CodePart = {
  id: "Now ISO String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Returns the current date and time as a string in ISO format",
  inputs: {},
  outputs: { now: { description: "Current date and time" } },
  run: (_, { now }) => now.next(new Date().toISOString()),
};

export const NowUnixTime = partFromSimpleFunction({
  id: "Now Unix Time",
  icon: "fa-calendar",
  namespace,
  description: "Returns the current date and time as a Unix time",
  output: { name: "now", description: "Current date and time" },
  run: () => new Date().getTime(),
});

export const DateFromUnixTime = partFromSimpleFunction({
  id: "Date From Unix Time",
  icon: "fa-calendar",
  namespace,
  description: "Creates a date from a Unix time",
  inputs: [{ name: "time", description: "Unix time" }],
  output: { name: "date", description: "Date" },
  run: (time) => new Date(time),
});

export const DateFromString: CodePart = {
  id: "Date From String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Creates a date from a string",
  inputs: { string: { description: "String" } },
  outputs: { date: { description: "Date" } },
  run: ({ string }, { date }) => date.next(new Date(string)),
};

export const DateFromISOString: CodePart = {
  id: "Date From ISO String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Creates a date from an ISO string",
  inputs: {
    string: { description: "String" },
  },
  outputs: {
    date: { description: "Date" },
  },
  run: async ({ string }, { date }, { onError }) => {
    try {
      date.next(new Date(string));
    } catch (e) {
      console.error("Error in part", e);
      onError(e);
    }
  },
};

export const DateToString = partFromSimpleFunction({
  id: "Date To String",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to a string",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "string", description: "String" },
  run: (date) => date.toString(),
});

export const DateToISOString = partFromSimpleFunction({
  id: "Date To ISO String",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to an ISO string",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "string", description: "String" },
  run: (date) => date.toISOString(),
});

export const DateToUnixTime = partFromSimpleFunction({
  id: "Date To Unix Time",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to a Unix time",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "time", description: "Unix time" },
  run: (date) => date.getTime(),
});

export const DateToYear = partFromSimpleFunction({
  id: "Date To Year",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to a year",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "year", description: "Year" },
  run: (date) => date.getFullYear(),
});

export const DateToMonth = partFromSimpleFunction({
  id: "Date To Month",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to a month",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "month", description: "Month" },
  run: (date) => date.getMonth(),
});

export const DateToDay = partFromSimpleFunction({
  id: "Date To Day",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to a day",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "day", description: "Day" },
  run: (date) => date.getDate(),
});

export const DateToHours = partFromSimpleFunction({
  id: "Date To Hours",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to hours",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "hours", description: "Hours" },
  run: (date) => date.getHours(),
});

export const DateToMinutes = partFromSimpleFunction({
  id: "Date To Minutes",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to minutes",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "minutes", description: "Minutes" },
  run: (date) => date.getMinutes(),
});

export const DateToSeconds = partFromSimpleFunction({
  id: "Date To Seconds",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to seconds",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "seconds", description: "Seconds" },
  run: (date) => date.getSeconds(),
});

export const DateToMilliseconds = partFromSimpleFunction({
  id: "Date To Milliseconds",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to milliseconds",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "milliseconds", description: "Milliseconds" },
  run: (date) => date.getMilliseconds(),
});

export const DateToDayOfWeek = partFromSimpleFunction({
  id: "Date To Day Of Week",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to a day of the week",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "day", description: "Day" },
  run: (date) => date.getDay(),
});

export const DateToTimezoneOffset = partFromSimpleFunction({
  id: "Date To Timezone Offset",
  icon: "fa-calendar",
  namespace,
  description: "Converts a date to a timezone offset",
  inputs: [{ name: "date", description: "Date" }],
  output: { name: "offset", description: "Offset" },
  run: (date) => date.getTimezoneOffset(),
});
