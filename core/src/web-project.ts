export type RestApiTrigger = {
  id: string;
  type: "rest-api";
  nodeId: string;
  data: {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "*"; // HTTP Method
  };
};

// export type EventTrigger = {
//     type: 'event',
//     data: {
//         eventName: string;
//     }
// }

export type ScheduledTrigger = {
  id: string;
  type: "scheduled";
  nodeId: string;
  data: {
    cronExpression: string;
  };
};

export type WebAppTrigger = {
  id: string;
  type: "web-app";
  nodeId: string;
  data: {
    path: string;
  };
};

export const isWebAppTrigger = (t: Trigger): t is WebAppTrigger => {
  return t.type === "web-app";
};

export const isRestApiTrigger = (t: Trigger): t is RestApiTrigger => {
  return t.type === "rest-api";
};

export const isScheduledTrigger = (t: Trigger): t is ScheduledTrigger => {
  return t.type === "scheduled";
};

export type Trigger = RestApiTrigger | ScheduledTrigger | WebAppTrigger;

export type TriggerType = Trigger["type"];
