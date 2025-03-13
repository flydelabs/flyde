import { THIS_INS_ID } from "../connect/helpers";

export type ConnectionData = {
  from: ConnectionNode;
  to: ConnectionNode;
  delayed?: boolean;
  hidden?: boolean;
};

export type ExternalConnectionNode = {
  insId: typeof THIS_INS_ID;
  pinId: string;
};

export type InternalConnectionNode = {
  insId: string;
  pinId: string;
};

export type ConnectionNode = ExternalConnectionNode | InternalConnectionNode;
