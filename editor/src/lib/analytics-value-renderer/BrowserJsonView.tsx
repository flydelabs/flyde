import type ReactJsonView from "react18-json-view";

export type ReactJsonViewProps = Parameters<typeof ReactJsonView>[0];

export const BrowserOnlyReactJson: React.FC<ReactJsonViewProps> = (props) => {
  if (typeof window === "undefined") {
    return null;
  }
  const ReactJson = require("react18-json-view").default;
  return <ReactJson {...props} />;
};
