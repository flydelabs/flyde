import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const Now: CodeNode = {
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

export const NowString: CodeNode = {
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

export const NowISOString: CodeNode = {
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

export const NowUnixTime: CodeNode = {
  id: "Now Unix Time",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Returns the current date and time as a Unix time",
  inputs: {},
  outputs: { now: { description: "Current date and time" } },
  run: (_, { now }) => now.next(new Date().getTime()),
};

export const DateFromUnixTime: CodeNode = {
  id: "Date From Unix Time",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Creates a date from a Unix time",
  inputs: { time: { description: "Unix time" } },
  outputs: { date: { description: "Date" } },
  run: ({ time }, { date }) => date.next(new Date(time)),
};

export const DateFromString: CodeNode = {
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

export const DateFromISOString: CodeNode = {
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
      console.error("Error in node", e);
      onError(e);
    }
  },
};

export const DateToString: CodeNode = {
  id: "Date To String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a string",
  inputs: { date: { description: "Date" } },
  outputs: { string: { description: "String" } },
  run: ({ date }, { string }) => string.next(date.toString()),
};

export const DateToISOString: CodeNode = {
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

export const DateToUnixTime: CodeNode = {
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

export const DateToYear: CodeNode = {
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
export const MonthToDate: CodeNode = {
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

export const DateToDay: CodeNode = {
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

export const DateToHours: CodeNode = {
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

export const DateToMinutes: CodeNode = {
  id: "Date To Minutes",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to minutes",
  inputs: { date: { description: "Date" } },
  outputs: { minutes: { description: "Minutes" } },
  run: ({ date }, { minutes }) => minutes.next(date.getMinutes()),
};

export const DateToSeconds: CodeNode = {
  id: "Date To Seconds",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to seconds",
  inputs: { date: { description: "Date" } },
  outputs: { seconds: { description: "Seconds" } },
  run: ({ date }, { seconds }) => seconds.next(date.getSeconds()),
};

export const DateToMilliseconds: CodeNode = {
  id: "Date To Milliseconds",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to milliseconds",
  inputs: { date: { description: "Date" } },
  outputs: { milliseconds: { description: "Milliseconds" } },
  run: ({ date }, { milliseconds }) =>
    milliseconds.next(date.getMilliseconds()),
};

export const DateToDayOfWeek: CodeNode = {
  id: "Date To Day Of Week",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a day of the week",
  inputs: { date: { description: "Date" } },
  outputs: { day: { description: "Day" } },
  run: ({ date }, { day }) => day.next(date.getDay()),
};

export const DateToTimezoneOffset: CodeNode = {
  id: "Date To Timezone Offset",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a timezone offset",
  inputs: { date: { description: "Date" } },
  outputs: { offset: { description: "Offset" } },
  run: ({ date }, { offset }) => offset.next(date.getTimezoneOffset()),
};
