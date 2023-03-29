import { conciseCodePart } from "./test-utils";

const errorReportingPart = conciseCodePart({
    id: "bad",
    inputs: ["a"],
    outputs: ["r"],
    fn: (_, __, { onError }) => {
      onError(new Error("blah"));
    },
  });