import { ConnectionNode, ExternalConnectionNode, InternalConnectionNode, ConnectionData } from ".";
import { PartDefinition, partInput, partOutput } from "..";

export const THIS_INS_ID = "__this";
export const ERROR_PIN_ID = "__error";
export const TRIGGER_PIN_ID = "__trigger";

export const getPartInputs = (part: PartDefinition) => {
  return {...part.inputs, [TRIGGER_PIN_ID]: partInput('any')};
}

export const getInputName = (pinId: string) => {
  switch (pinId) {
    case TRIGGER_PIN_ID:
        return 'Trigger Part';
    default:
        return pinId;
  }
}

export const getOutputName = (pinId: string) => {
  switch (pinId) {
    case ERROR_PIN_ID:
        return 'Error';
    default:
        return pinId;
  }
}

export const getPartOutputs = (part: PartDefinition) => {
  return {...part.outputs, [ERROR_PIN_ID]: partOutput('error')};
}

export const isExternalConnectionNode = (node: ConnectionNode): node is ExternalConnectionNode => {
  return node.insId === THIS_INS_ID;
};

export const isInternalConnectionNode = (node: ConnectionNode): node is InternalConnectionNode => {
  return node.insId !== THIS_INS_ID;
};

export const isExternalConnection = ({ from, to }: ConnectionData): boolean => {
  return isExternalConnectionNode(from) || isExternalConnectionNode(to);
};

export const isInternalConnection = (conn: ConnectionData) => !isExternalConnection(conn);

export const externalConnectionNode = (pinId: string): ExternalConnectionNode => {
  return { insId: THIS_INS_ID, pinId };
};

export const connectionNode = (insId: string, pinId: string): ConnectionNode => {
  return { insId, pinId };
};

export const connectionNodeEquals = (conn1: ConnectionNode, conn2: ConnectionNode): boolean => {
  return conn1.insId === conn2.insId && conn1.pinId === conn2.pinId;
};

export const connectionDataEquals = (cd1?: ConnectionData, cd2?: ConnectionData): boolean => {
  if (!cd1 || !cd2) {
    return false;
  }
  return connectionNodeEquals(cd1.from, cd2.from) && connectionNodeEquals(cd1.to, cd2.to);
};

export function connectionData(from: string, to: string, delayed?: boolean): ConnectionData;
export function connectionData(
  from: [string, string],
  to: [string, string],
  delayed?: boolean
): ConnectionData;
export function connectionData(
  from: [string, string],
  to: [string],
  delayed?: boolean
): ConnectionData;
export function connectionData(
  from: [string],
  to: [string, string],
  delayed?: boolean
): ConnectionData;
export function connectionData(fromRaw: any, toRaw: any, delayed?: any): any {
  const from = typeof fromRaw === "string" ? fromRaw.split(".") : fromRaw;
  const to = typeof toRaw === "string" ? toRaw.split(".") : toRaw;

  if (from.length > 2 || to.length > 2) {
    throw new Error(`invalid source or target to connection data - ${fromRaw} / ${toRaw}`);
  }

  return {
    from: from.length === 2 ? connectionNode(from[0], from[1]) : externalConnectionNode(from[0]),
    to: to.length === 2 ? connectionNode(to[0], to[1]) : externalConnectionNode(to[0]),
    delayed,
  };
}

export const connection = (
  from: ConnectionNode,
  to: ConnectionNode,
  delayed = false
): ConnectionData => {
  return { from, to, delayed };
};
