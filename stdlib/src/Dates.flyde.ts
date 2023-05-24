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

export const DateToISOString: CodePart = {
  id: "Date To ISO String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to an ISO string",
  inputs: { date: { description: "Date" } },
  outputs: { string: { description: "String" } },
  run: ({ date }, { string }) => string.next(date.toISOString()),
};

export const DateToUnixTime: CodePart = {
  id: "Date To Unix Time",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a Unix time",
  inputs: { date: { description: "Date" } },
  outputs: { time: { description: "Unix time" } },
  run: ({ date }, { time }) => time.next(date.getTime()),
};

export const DateToYear: CodePart = {
  id: "Date To Year",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a year",
  inputs: {
    date: { description: "Date" },
  },
  outputs: {
    year: { description: "Year" },
  },
  run: ({ date }, { year }) => year.next(date.getFullYear()),
};
export const MonthToDate: CodePart = {
  id: "Month To Date",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a month",
  inputs: {
    date: {
      description: "Date",
    },
  },
  outputs: {
    month: {
      description: "Month",
    },
  },
  run: ({ date }, { month }) => month.next(date.getMonth()),
};

export const DateToDay: CodePart = {
  id: "Date To Day",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a day",
  inputs: {
    date: {
      description: "Date",
    },
  },
  outputs: {
    day: {
      description: "Day",
    },
  },
  run: ({ date }, { day }) => day.next(date.getDate()),
};

export const DateToHours: CodePart = {
  id: "Date To Hours",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to hours",
  inputs: {
    date: {
      description: "Date",
    },
  },
  outputs: {
    hours: {
      description: "Hours",
    },
  },
  run: ({ date }, { hours }) => hours.next(date.getHours()),
};

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
